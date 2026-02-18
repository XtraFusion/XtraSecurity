import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// GET /api/audit/export?format=json|csv&start=...&end=...
// POST /api/audit/export - Trigger export with robust filtering
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { format, startDate, endDate, projectId, action } = await req.json();

    const where: any = {};
    if (startDate) where.timestamp = { gte: new Date(startDate) };
    if (endDate) {
        where.timestamp = { 
            ...(where.timestamp || {}),
            lte: new Date(endDate)
        };
    }
    
    // Filter by project via entityId or metadata
    // This assumes audit logs store 'project:<id>' in entityId or similar for project actions
    if (projectId) {
        // Simple search for now: entityId matches or is related
        // Or if we stored projectId in metadata
        where.OR = [
            { entityId: projectId },
            { changes: { path: ["projectId"], equals: projectId } } // If using JSON filter
        ];
    }

    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "asc" },
      include: { user: { select: { email: true, name: true } } }
    });

    if (format === "csv") {
        const header = "Timestamp,Action,User,Entity,EntityID,Status,Metadata\n";
        const rows = logs.map(log => {
            const user = log.user?.email || log.userId || "System";
            const changes = log.changes ? JSON.stringify(log.changes).replace(/"/g, '""') : "";
            const status = "Success"; // Audit logs usually imply success unless specified?
            
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
                "Content-Disposition": `attachment; filename="xtra-audit-${startDate || 'all'}-${Date.now()}.csv"`
            }
        });
    }

    return NextResponse.json({ data: logs });

  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
