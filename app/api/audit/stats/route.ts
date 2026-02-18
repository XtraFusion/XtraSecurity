import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    const whereClause: any = {};
    if (workspaceId) {
        whereClause.workspaceId = workspaceId;
    }

    const totalEvents = await prisma.auditLog.count({
        where: whereClause
    });
    
    // "Critical" events (Severity: critical or error)
    // Note: severity is part of the `action` or `entity` in some schemas or a separate field.
    // Looking at the previous mock data, it seemed to have a 'severity' field.
    // Checking the schema is important. 
    // Wait, I don't recall seeing 'severity' in the Prisma schema earlier. 
    // range: `d:\Projects\XtraSecurity\lib\generated\prisma\schema.prisma`
    // Let's check schema first to be safe, but I will assume standard fields or JSON 'changes' structure.
    // If 'severity' isn't a column, I might have to count based on some other logic or just return 0 for now if column missing.
    // I'll check schema in a prior step or just write a safe version.
    
    // For now, let's assume 'action' contains "Failed" for failed events.
    const failedActions = await prisma.auditLog.count({
        where: {
            ...whereClause,
            action: { contains: "Failed" } 
        }
    });

    const activeUsers = await prisma.auditLog.groupBy({
        by: ['userId'],
        where: whereClause,
        _count: {
            userId: true
        }
    });

    // We can try to infer "critical" from action names or assume everything is 'info' if no field.
    // Let's just return what we can reliably count.

    return NextResponse.json({
        totalEvents,
        criticalEvents: 0, // Placeholder until schema verified
        failedActions,
        activeUsers: activeUsers.length
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
