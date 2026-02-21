import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const timeRange = url.searchParams.get("range") || "7d"; // 24h, 7d, 30d
    const workspaceId = url.searchParams.get("workspaceId");

    let startDate = new Date();
    if (timeRange === "24h") startDate.setHours(startDate.getHours() - 24);
    else if (timeRange === "30d") startDate.setDate(startDate.getDate() - 30);
    else startDate.setDate(startDate.getDate() - 7);

    const whereClause: any = { timestamp: { gte: startDate } };
    if (workspaceId) {
        whereClause.workspaceId = workspaceId;
    }

    // 1. Total events in range
    const totalEvents = await prisma.auditLog.count({
      where: whereClause
    });

    // 2. Secret Accesses
    const secretAccesses = await prisma.auditLog.count({
      where: {
        ...whereClause,
        action: { contains: "secret_access" }
      }
    });

    // 3. Failed Logins & Actions
    const failedLogins = await prisma.auditLog.count({
      where: {
        ...whereClause,
        OR: [
          { action: { in: ["login_failed", "auth_failure"] } },
          { action: { contains: "fail" } },
          { action: { contains: "Fail" } }
        ]
      }
    });

    // Count Active Users
    const activeUsersGroups = await prisma.auditLog.groupBy({
        by: ['userId'],
        where: whereClause,
        _count: { userId: true }
    });
    const activeUsers = activeUsersGroups.length;

    // 4. Activity over time (grouped by day or hour)
    // Prisma doesn't support easy grouping by date part in all DBs without raw query.
    // For simplicity, we'll fetch recent high-level events or use raw query if MongoDB supports it (aggregate).
    // MongoDB raw aggregate:
    const pipeline: any[] = [
      { $match: { timestamp: { $gte: startDate } } }
    ];
    if (workspaceId) {
        pipeline[0].$match.workspaceId = { $oid: workspaceId };
    }
    
    pipeline.push(
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    );

    let activityTrend: any[] = [];
    try {
        const rawStats = await prisma.auditLog.aggregateRaw({
            pipeline: pipeline as any
        });
        
        if (Array.isArray(rawStats)) {
            activityTrend = rawStats.map((item: any) => ({
                date: item._id,
                count: item.count
            }));
        }
    } catch (e) {
        console.error("Aggregation failed, fallback to basic count", e);
    }

    // 5. Recent Anomalies
    const anomalies = await prisma.auditLog.findMany({
        where: {
            ...whereClause,
            action: { in: ["break_glass", "admin_override", "bulk_export", "access_revoked"] }
        },
        orderBy: { timestamp: "desc" },
        take: 5,
        include: { user: true }
    });

    return NextResponse.json({
        period: timeRange,
        stats: {
            totalEvents,
            secretAccesses,
            failedLogins,
            activeUsers
        },
        trend: activityTrend,
        anomalies
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
