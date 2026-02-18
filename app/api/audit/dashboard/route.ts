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

    let startDate = new Date();
    if (timeRange === "24h") startDate.setHours(startDate.getHours() - 24);
    else if (timeRange === "30d") startDate.setDate(startDate.getDate() - 30);
    else startDate.setDate(startDate.getDate() - 7);

    // 1. Total events in range
    const totalEvents = await prisma.auditLog.count({
      where: { timestamp: { gte: startDate } }
    });

    // 2. Secret Accesses
    const secretAccesses = await prisma.auditLog.count({
      where: {
        timestamp: { gte: startDate },
        action: { contains: "secret_access" }
      }
    });

    // 3. Failed Logins
    // Assuming 'login_failed' action exists or we look for 'LOGIN_FAILURE'
    const failedLogins = await prisma.auditLog.count({
      where: {
        timestamp: { gte: startDate },
        action: { in: ["login_failed", "auth_failure"] }
      }
    });

    // 4. Activity over time (grouped by day or hour)
    // Prisma doesn't support easy grouping by date part in all DBs without raw query.
    // For simplicity, we'll fetch recent high-level events or use raw query if MongoDB supports it (aggregate).
    // MongoDB raw aggregate:
    const pipeline = [
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ];

    let activityTrend = [];
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

    // 5. Recent Anomalies (e.g. implementation specific, maybe breaks glass or high severity)
    const anomalies = await prisma.auditLog.findMany({
        where: {
            timestamp: { gte: startDate },
            action: { in: ["break_glass", "admin_override", "bulk_export"] }
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
            failedLogins
        },
        trend: activityTrend,
        anomalies
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
