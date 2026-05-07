import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
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
       return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
    }

    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole((auth as any).id, workspaceId);

    if (role === "viewer") {
       return NextResponse.json({ error: "Forbidden: Viewers cannot access Integrations." }, { status: 403 });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 0. Fetch connected integrations for the user
    const integrations = await prisma.integration.findMany({
      where: { 
        userId: (auth as any).id
      }
    });

    // 1. Fetch all projects in the workspace
    const wsProjects = await prisma.project.findMany({
      where: { workspaceId },
      select: { id: true }
    });
    const wsProjectIds = wsProjects.map(p => p.id);

    // 2. Fetch sync logs from AuditLog for these projects
    const syncLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { workspaceId },
          { entityId: { in: wsProjectIds } }
        ],
        action: { endsWith: "_sync" }
      },
      orderBy: { timestamp: "desc" },
      take: 100,
      include: {
        user: {
           select: { name: true, image: true, email: true }
        }
      }
    });

    // 3. Summarize health (24h)
    const recentSyncs = syncLogs.filter(log => new Date(log.timestamp) >= last24h);
    const successCount = recentSyncs.filter(log => {
       const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes;
       return changes?.successCount > 0 && (!changes.failedCount || changes.failedCount === 0);
    }).length;

    const failedCount = recentSyncs.length - successCount;

    // 4. Map integrations to their projects
    // Find secrets that use these integrations? 
    // Actually, projects have many secrets, and secrets are synced to integrations.
    // The AuditLog includes entityId as projectId.

    const projectIds = Array.from(new Set(syncLogs.map(log => log.entityId).filter(Boolean))) as string[];
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true }
    });

    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    return NextResponse.json({
      integrations: integrations.map(i => ({
        id: i.id,
        name: i.username || i.provider,
        type: i.provider,
        status: i.status || "connected",
        enabled: i.enabled,
        lastSync: syncLogs.find(log => log.action === `${i.provider}_sync`)?.timestamp || null
      })),
      history: syncLogs.map(log => ({
        id: log.id,
        action: log.action,
        timestamp: log.timestamp,
        user: log.user,
        projectName: projectMap.get(log.entityId || "") || "Unknown Project",
        projectId: log.entityId,
        metadata: typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes
      })),
      summary: {
        total24h: recentSyncs.length,
        success24h: successCount,
        failed24h: failedCount,
        successRate: recentSyncs.length > 0 ? Math.round((successCount / recentSyncs.length) * 100) : 100
      }
    });

  } catch (error: any) {
    console.error("Sync Status API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
