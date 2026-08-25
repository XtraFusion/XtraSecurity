import fs from "fs";
import path from "path";

export interface OperationRecord {
  id: string;
  timestamp: string;
  scenario: string;
  role: string;
  actorEmail: string;
  endpoint: string;
  method: string;
  requestPayload?: any;
  responseStatus: number;
  responseSummary: any;
  expectedStatus: number | number[];
  passed: boolean;
  securityVerdict: "SECURE_ALLOWED" | "SECURE_BLOCKED" | "SECURITY_VIOLATION" | "UNEXPECTED_FAILURE";
  notes?: string;
}

export class SimulationLogger {
  private records: OperationRecord[] = [];
  private reportDir: string;
  private jsonPath: string;
  private mdPath: string;

  constructor() {
    this.reportDir = path.join(process.cwd(), "tests", "reports");
    this.jsonPath = path.join(this.reportDir, "user-role-simulation-log.json");
    this.mdPath = path.join(this.reportDir, "user-role-simulation-report.md");

    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  log(record: Omit<OperationRecord, "id" | "timestamp" | "passed" | "securityVerdict"> & {
    securityVerdict?: "SECURE_ALLOWED" | "SECURE_BLOCKED" | "SECURITY_VIOLATION" | "UNEXPECTED_FAILURE";
  }) {
    const isExpected = Array.isArray(record.expectedStatus)
      ? record.expectedStatus.includes(record.responseStatus)
      : record.responseStatus === record.expectedStatus;

    let verdict = record.securityVerdict;
    if (!verdict) {
      if (isExpected) {
        verdict = (record.responseStatus >= 200 && record.responseStatus < 300)
          ? "SECURE_ALLOWED"
          : "SECURE_BLOCKED";
      } else {
        verdict = (record.responseStatus >= 200 && record.responseStatus < 300)
          ? "SECURITY_VIOLATION"
          : "UNEXPECTED_FAILURE";
      }
    }

    const fullRecord: OperationRecord = {
      id: `op_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      passed: isExpected,
      securityVerdict: verdict,
      ...record,
    };

    this.records.push(fullRecord);
  }

  save() {
    // 1. Save JSON log
    fs.writeFileSync(this.jsonPath, JSON.stringify(this.records, null, 2), "utf8");

    // 2. Generate Markdown Report
    const total = this.records.length;
    const passedCount = this.records.filter((r) => r.passed).length;
    const failedCount = total - passedCount;
    const violations = this.records.filter((r) => r.securityVerdict === "SECURITY_VIOLATION").length;

    let md = `# Comprehensive User Role Simulation & RBAC Security Audit Report\n\n`;
    md += `**Generated**: ${new Date().toISOString()}\n\n`;
    md += `## Executive Summary\n\n`;
    md += `- **Total Operations Simulated**: ${total}\n`;
    md += `- **Successful Operations (Expected Behavior)**: ${passedCount} / ${total} (${((passedCount / total) * 100).toFixed(1)}%)\n`;
    md += `- **Failures / Anomalies**: ${failedCount}\n`;
    md += `- **Critical Security Violations (Unauthorized Leaks/Mutations)**: ${violations}\n\n`;

    md += `## Operations Matrix by Role\n\n`;
    md += `| ID | Scenario | Actor Role | Method | Endpoint | Expected | Received | Security Verdict | Passed |\n`;
    md += `| :--- | :--- | :--- | :---: | :--- | :---: | :---: | :--- | :---: |\n`;

    for (const r of this.records) {
      const statusIcon = r.passed ? "✅" : "❌";
      const expectedStr = Array.isArray(r.expectedStatus) ? r.expectedStatus.join("/") : r.expectedStatus.toString();
      md += `| \`${r.id}\` | ${r.scenario} | **${r.role}** | \`${r.method}\` | \`${r.endpoint}\` | \`${expectedStr}\` | \`${r.responseStatus}\` | \`${r.securityVerdict}\` | ${statusIcon} |\n`;
    }

    md += `\n## Detailed Operation Records\n\n`;
    for (const r of this.records) {
      md += `### [${r.passed ? "PASS" : "FAIL"}] ${r.scenario} (\`${r.id}\`)\n`;
      md += `- **Actor**: \`${r.actorEmail}\` (**Role**: \`${r.role}\`)\n`;
      md += `- **Request**: \`${r.method} ${r.endpoint}\`\n`;
      md += `- **Status**: \`${r.responseStatus}\` (Expected: \`${Array.isArray(r.expectedStatus) ? r.expectedStatus.join("/") : r.expectedStatus}\`)\n`;
      md += `- **Security Verdict**: \`${r.securityVerdict}\`\n`;
      if (r.notes) md += `- **Notes**: ${r.notes}\n`;
      if (r.requestPayload) {
        md += `- **Request Payload**:\n\`\`\`json\n${JSON.stringify(r.requestPayload, null, 2)}\n\`\`\`\n`;
      }
      md += `- **Response Summary**:\n\`\`\`json\n${JSON.stringify(r.responseSummary, null, 2)}\n\`\`\`\n\n`;
    }

    fs.writeFileSync(this.mdPath, md, "utf8");
    return { total, passedCount, failedCount, violations, jsonPath: this.jsonPath, mdPath: this.mdPath };
  }
}
