import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const timeRange = url.searchParams.get("range") || "7d";

    const startDate = new Date();
    if (timeRange === "24h") startDate.setHours(startDate.getHours() - 24);
    else if (timeRange === "30d") startDate.setDate(startDate.getDate() - 30);
    else startDate.setDate(startDate.getDate() - 7);

    // --- Summary Stats ---
    // Filter by userEmail to prevent global data leak
    const userFilter = { userEmail: session.user.email };

    const [totalEvents, anomalyCount, rateLimitCount] = await Promise.all([
      prisma.securityEvent.count({
        where: { timestamp: { gte: startDate }, ...userFilter },
      }),
      prisma.securityEvent.count({
        where: { timestamp: { gte: startDate }, isAnomaly: true, ...userFilter },
      }),
      prisma.securityEvent.count({
        where: { timestamp: { gte: startDate }, rateLimitHit: true, ...userFilter },
      }),
    ]);

    // Unique IPs via aggregation (filtered)
    let uniqueIps = 0;
    try {
      const ipAgg = await prisma.securityEvent.aggregateRaw({
        pipeline: [
          { $match: { timestamp: { $gte: { $date: startDate.toISOString() } }, userEmail: session.user.email } },
          { $group: { _id: "$ipAddress" } },
          { $count: "total" },
        ],
      });
      if (Array.isArray(ipAgg) && ipAgg.length > 0) {
        uniqueIps = (ipAgg[0] as any).total ?? 0;
      }
    } catch (_) {}

    // --- Activity Trend (events per day) ---
    let activityTrend: { date: string; events: number }[] = [];
    try {
      const trendAgg = await prisma.securityEvent.aggregateRaw({
        pipeline: [
          { $match: { timestamp: { $gte: { $date: startDate.toISOString() } }, userEmail: session.user.email } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
              events: { $sum: 1 },
              anomalies: { $sum: { $cond: ["$isAnomaly", 1, 0] } },
            },
          },
          { $sort: { _id: 1 } },
        ],
      });
      if (Array.isArray(trendAgg)) {
        activityTrend = trendAgg.map((item: any) => ({
          date: item._id,
          events: item.events,
          anomalies: item.anomalies,
        }));
      }
    } catch (_) {}

    // --- Top Countries ---
    let topCountries: { country: string; count: number }[] = [];
    try {
      const countryAgg = await prisma.securityEvent.aggregateRaw({
        pipeline: [
          { $match: { timestamp: { $gte: { $date: startDate.toISOString() } }, country: { $ne: null }, userEmail: session.user.email } },
          { $group: { _id: "$country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ],
      });
      if (Array.isArray(countryAgg)) {
        topCountries = countryAgg.map((item: any) => ({
          country: item._id || "Unknown",
          count: item.count,
        }));
      }
    } catch (_) {}

    // --- Recent Anomalies ---
    const recentAnomalies = await prisma.securityEvent.findMany({
      where: { isAnomaly: true, timestamp: { gte: startDate }, ...userFilter },
      orderBy: { timestamp: "desc" },
      take: 10,
      select: {
        id: true,
        timestamp: true,
        ipAddress: true,
        country: true,
        city: true,
        endpoint: true,
        method: true,
        statusCode: true,
        riskFactors: true,
        userEmail: true,
      },
    });

    // --- Recent Audit Logs (for current user) ---
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        timestamp: true,
        workspaceId: true,
      },
    });

    return NextResponse.json({
      range: timeRange,
      stats: {
        totalEvents,
        anomalyCount,
        rateLimitCount,
        uniqueIps,
      },
      activityTrend,
      topCountries,
      recentAnomalies,
      recentAuditLogs,
    });
  } catch (error: any) {
    console.error("[security/dashboard]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch security dashboard data" },
      { status: 500 }
    );
  }
}
