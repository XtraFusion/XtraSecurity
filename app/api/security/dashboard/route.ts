import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

export async function GET(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const timeRange = url.searchParams.get("range") || "7d";

    const startDate = new Date();
    if (timeRange === "24h") startDate.setHours(startDate.getHours() - 24);
    else if (timeRange === "30d") startDate.setDate(startDate.getDate() - 30);
    else startDate.setDate(startDate.getDate() - 7);

    const workspaceId = url.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
    }

    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const wsRole = await getUserWorkspaceRole(auth.userId, workspaceId);

    const projectWhereClause: any = { workspaceId };
    
    if (wsRole !== "owner" && wsRole !== "admin") {
      projectWhereClause.OR = [
        { userId: auth.userId },
        { teamProjects: { some: { team: { members: { some: { userId: auth.userId, status: "active" } } } } } }
      ];
    }

    const wsProjects = await prisma.project.findMany({
      where: projectWhereClause,
      select: { id: true }
    });
    const wsProjectIds = wsProjects.map(p => p.id);

    if (wsProjectIds.length === 0 && wsRole !== "owner" && wsRole !== "admin") {
      return NextResponse.json({
        range: timeRange,
        stats: { totalEvents: 0, anomalyCount: 0, rateLimitCount: 0, uniqueIps: 0 },
        activityTrend: [],
        topCountries: [],
        recentAnomalies: [],
        recentAuditLogs: [],
      });
    }

    // --- Summary Stats ---
    const baseFilter = (wsRole === "owner" || wsRole === "admin") 
      ? { workspaceId } 
      : { projectId: { in: wsProjectIds } };

    const [totalEvents, anomalyCount, rateLimitCount] = await Promise.all([
      prisma.securityEvent.count({
        where: { timestamp: { gte: startDate }, ...baseFilter },
      }),
      prisma.securityEvent.count({
        where: { timestamp: { gte: startDate }, isAnomaly: true, ...baseFilter },
      }),
      prisma.securityEvent.count({
        where: { timestamp: { gte: startDate }, rateLimitHit: true, ...baseFilter },
      }),
    ]);

    // Unique IPs via aggregation (filtered)
    let uniqueIps = 0;
    try {
      const ipAgg = await prisma.securityEvent.aggregateRaw({
        pipeline: [
          { $match: { 
              timestamp: { $gte: { $date: startDate.toISOString() } },
              ...(wsRole === "owner" || wsRole === "admin" 
                  ? { workspaceId: { $oid: workspaceId } } 
                  : { projectId: { $in: wsProjectIds.map(id => ({ $oid: id })) } })
            } 
          },
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
          { $match: { 
              timestamp: { $gte: { $date: startDate.toISOString() } },
              ...(wsRole === "owner" || wsRole === "admin" 
                  ? { workspaceId: { $oid: workspaceId } } 
                  : { projectId: { $in: wsProjectIds.map(id => ({ $oid: id })) } })
            } 
          },
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
          { $match: { 
              timestamp: { $gte: { $date: startDate.toISOString() } }, 
              country: { $ne: null },
              ...(wsRole === "owner" || wsRole === "admin" 
                  ? { workspaceId: { $oid: workspaceId } } 
                  : { projectId: { $in: wsProjectIds.map(id => ({ $oid: id })) } })
            } 
          },
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
      where: { isAnomaly: true, timestamp: { gte: startDate }, ...baseFilter },
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

    // --- Recent Audit Logs (for accessible projects) ---
    const auditWhere = (wsRole === "owner" || wsRole === "admin")
      ? { workspaceId }
      : { 
          OR: [
            { userId: auth.userId },
            { entityId: { in: wsProjectIds } }
          ]
        };

    const recentAuditLogs = await prisma.auditLog.findMany({
      where: auditWhere,
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
