export interface ScoreFactor {
    label: string;
    score: number;
    maxScore: number;
    statusBy: "mfa" | "rotation" | "audit" | "restriction";
}

export interface SecurityScore {
    total: number; // 0-100
    factors: ScoreFactor[];
    grade: "A" | "B" | "C" | "D" | "F";
}

/**
 * Calculates a weighted security score from compliance report data.
 * Weights: 
 * - MFA adoption (40%)
 * - Rotation Health (no overdue secrets) (30%)
 * - Audit Logging (20%)
 * - IP Restrictions (10%)
 */
export function calculateSecurityScore(report: any): SecurityScore {
    const factors: ScoreFactor[] = [];
    
    // 1. MFA Adoption (40 points)
    // In this scope, we check if the report owner (the one who generated it) has MFA.
    // If it's a team audit, it would check the avg. MFA adoption.
    const mfaScore = report.generatedByMfaEnabled ? 40 : 0;
    factors.push({ label: "MFA Adoption", score: mfaScore, maxScore: 40, statusBy: "mfa" });

    // 2. Rotation Health (30 points)
    // If there are overdue rotations, we deduct points proportionally
    const totalSecrets = report.summary.totalSecrets || 0;
    const overdueRotations = report.summary.overdueRotations || 0;
    let rotationScore = 30;
    if (totalSecrets > 0) {
        const ratio = overdueRotations / totalSecrets;
        rotationScore = Math.max(0, Math.floor(30 * (1 - ratio)));
    }
    factors.push({ label: "Rotation Health", score: rotationScore, maxScore: 30, statusBy: "rotation" });

    // 3. Audit Logging (20 points)
    // Check if auditLogging is enabled across projects
    const totalProjects = report.summary.totalProjects || 1;
    const projectsWithAudit = report.projects.filter((p: any) => p.auditLogging).length;
    const auditScore = Math.floor(20 * (projectsWithAudit / totalProjects));
    factors.push({ label: "Audit Logging", score: auditScore, maxScore: 20, statusBy: "audit" });

    // 4. IP Restrictions (10 points)
    const projectsWithRestriction = report.projects.filter((p: any) => p.ipRestrictions?.length > 0).length;
    const restrictionScore = Math.floor(10 * (projectsWithRestriction / totalProjects));
    factors.push({ label: "IP Allowlisting", score: restrictionScore, maxScore: 10, statusBy: "restriction" });

    const total = mfaScore + rotationScore + auditScore + restrictionScore;

    let grade: SecurityScore["grade"] = "F";
    if (total >= 90) grade = "A";
    else if (total >= 80) grade = "B";
    else if (total >= 70) grade = "C";
    else if (total >= 60) grade = "D";

    return { total, factors, grade };
}
