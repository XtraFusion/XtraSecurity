import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserWorkspaceRole } from "@/lib/permissions";
import { verifyAuth } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // Permission Check
    const role = await getUserWorkspaceRole(auth.userId, workspaceId);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Fetch all secrets for the workspace
    const secrets = await prisma.secret.findMany({
      where: {
        project: {
          workspaceId: workspaceId
        }
      },
      include: {
        project: true
      }
    });

    if (secrets.length === 0) {
       return NextResponse.json({
         total: 0,
         staleCount: 0,
         duplicateCount: 0,
         autoRotationCount: 0,
         securityScore: 100, // Perfect score for empty workspace?
         criticalFixes: [],
         environmentalDrift: []
       });
    }

    const now = new Date();
    const staleThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 2. Metrics Calculation
    let staleCount = 0;
    let autoRotationCount = 0;
    const keyMap = new Map<string, number>();
    const criticalFixes: any[] = [];

    secrets.forEach(secret => {
      // Stale
      if (new Date(secret.lastUpdated) < staleThreshold) {
        staleCount++;
        criticalFixes.push({
          type: "stale",
          key: secret.key,
          projectId: secret.projectId,
          projectName: secret.project.name,
          daysOld: Math.floor((now.getTime() - new Date(secret.lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
        });
      }

      // Auto-rotation
      if (secret.rotationPolicy === "auto" || secret.rotationPolicy === "interval") {
        autoRotationCount++;
      } else {
         criticalFixes.push({
          type: "manual_rotation",
          key: secret.key,
          projectId: secret.projectId,
          projectName: secret.project.name,
          description: "Missing automated rotation policy"
        });
      }

      // Duplicates
      keyMap.set(secret.key, (keyMap.get(secret.key) || 0) + 1);
    });

    // Duplicate Keys
    let duplicateCount = 0;
    keyMap.forEach((count, key) => {
      if (count > 1) {
        duplicateCount += (count - 1);
        criticalFixes.push({
          type: "duplicate",
          key: key,
          count: count,
          description: `Key reused across ${count} resources`
        });
      }
    });

    // 3. Security Score Logic (Max 100)
    // Freshness (40 pts): % of secrets not stale
    const freshnessScore = ((secrets.length - staleCount) / secrets.length) * 40;
    // Rotation (30 pts): % of secrets with auto-rotation
    const rotationScore = (autoRotationCount / secrets.length) * 30;
    // Uniqueness (30 pts): % of unique keys
    const uniquenessScore = (keyMap.size / secrets.length) * 30;

    const totalScore = Math.round(freshnessScore + rotationScore + uniquenessScore);

    // 4. Drift Check (Simple environmental consistency)
    // Find keys that exist in Staging but not in Production for the same project
    const drift: any[] = [];
    const projects = Array.from(new Set(secrets.map(s => s.projectId)));
    
    projects.forEach(pid => {
      const projSecrets = secrets.filter(s => s.projectId === pid);
      const prodKeys = new Set(projSecrets.filter(s => s.environmentType === 'production').map(s => s.key));
      const stagingKeys = new Set(projSecrets.filter(s => s.environmentType === 'staging').map(s => s.key));
      
      stagingKeys.forEach(k => {
        if (!prodKeys.has(k)) {
          drift.push({
             projectId: pid,
             projectName: projSecrets[0].project.name,
             key: k,
             missingIn: 'production'
          });
        }
      });
    });

    return NextResponse.json({
      total: secrets.length,
      staleCount,
      duplicateCount,
      autoRotationCount,
      securityScore: totalScore,
      criticalFixes: criticalFixes.slice(0, 10), // Limit to top 10 for dashboard
      environmentalDrift: drift
    });

  } catch (error: any) {
    console.error("Health Metrics Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
