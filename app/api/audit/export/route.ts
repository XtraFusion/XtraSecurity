import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { hasPermission, getUserWorkspaceRole } from "@/lib/permissions";

// POST /api/audit/export - Trigger export with robust filtering
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { format, startDate, endDate, projectId, action } = await req.json();

    // 1. RBAC Check: User must have `audit.export` OR be the Workspace Owner/Admin
    // If projectId is provided, it's actually acting as a Workspace ID in the frontend currently
    // since we pass `projectId: selectedWorkspace?.id` there.
    let isAuthorized = false;

    // First check global system permission
    if (await hasPermission(auth.userId, "audit.export")) {
        isAuthorized = true;
    } else if (projectId) {
        // Fallback: Check if user is Workspace Admin/Owner
        const role = await getUserWorkspaceRole(auth.userId, projectId);
        if (role === "admin" || role === "owner") {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        return NextResponse.json(
            { error: "Forbidden: You do not have permission to export audit logs." }, 
            { status: 403 }
        );
    }

    // 2. Query Building
    const where: any = {};
    if (startDate) where.timestamp = { gte: new Date(startDate) };
    if (endDate) {
        where.timestamp = { 
            ...(where.timestamp || {}),
            lte: new Date(endDate)
        };
    }
    
    // In frontend, `projectId` is actually `workspaceId`, but database model for audit 
    // uses `entityId` for project. We should filter by the workspace's projects.
    // However, the current logic relies on simple `entityId` match.
    if (projectId) {
        where.OR = [
            { entityId: projectId },
            { changes: { path: ["projectId"], equals: projectId } } 
        ];
    }

    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "asc" },
      include: { user: { select: { email: true, name: true } } }
    });

    const filenameBase = `xtra-audit-${startDate ? new Date(startDate).toISOString().split('T')[0] : 'all'}-${Date.now()}`;

    // 3. Format: CSV
    if (format === "csv") {
        const header = "Timestamp,Action,User,Entity,EntityID,Status,Metadata\n";
        const rows = logs.map(log => {
            const user = log.user?.email || log.userId || "System";
            const changes = log.changes ? JSON.stringify(log.changes).replace(/"/g, '""') : "";
            const status = "Success"; // Defaulting to success if not explicitly failed
            
            return [
                `"${log.timestamp.toISOString()}"`,
                `"${log.action}"`,
                `"${user}"`,
                `"${log.entity || ""}"`,
                `"${log.entityId || ""}"`,
                `"${status}"`,
                `"${changes}"`
            ].join(",");
        });

        const csv = header + rows.join("\n");
        
        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filenameBase}.csv"`
            }
        });
    }

    // 4. Format: JSON (Downloadable)
    if (format === "json") {
        return new NextResponse(JSON.stringify(logs, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${filenameBase}.json"`
            }
        });
    }

    // Fallback JSON response (not a download attachment)
    return NextResponse.json({ data: logs });

  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
