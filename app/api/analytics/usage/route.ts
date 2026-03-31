import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
       return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Fetch SecurityEvents for secret fetches in this workspace
    // We filter by endpoint starting with /api/secret and successful status
    const events = await prisma.securityEvent.findMany({
      where: {
        workspaceId,
        endpoint: { startsWith: "/api/secret" },
        statusCode: 200,
        timestamp: { gte: thirtyDaysAgo }
      }
    });

    // 2. Aggregate Top Projects
    const projectCounts: Record<string, number> = {};
    events.forEach(e => {
       if (e.projectId) projectCounts[e.projectId] = (projectCounts[e.projectId] || 0) + 1;
    });

    const projectIds = Object.keys(projectCounts);
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true }
    });
    
    const topProjects = projects.map(p => ({
      id: p.id,
      name: p.name,
      count: projectCounts[p.id]
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    // 3. Aggregate Top Actors (Distinguish SA vs Human)
    const actorCounts: Record<string, { count: number, email?: string, isSA: boolean }> = {};
    events.forEach(e => {
       const id = e.apiKeyId ? `sa_${e.apiKeyId}` : e.userId || "unknown";
       if (!actorCounts[id]) {
         actorCounts[id] = { count: 0, email: e.userEmail || undefined, isSA: !!e.apiKeyId };
       }
       actorCounts[id].count++;
    });

    const topActors = Object.entries(actorCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 4. Usage Timeline (30 days)
    const timelineMap: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split('T')[0];
        timelineMap[key] = 0;
    }

    events.forEach(e => {
       const key = e.timestamp.toISOString().split('T')[0];
       if (timelineMap[key] !== undefined) timelineMap[key]++;
    });

    const usageTimeline = Object.entries(timelineMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 5. Overall Summary
    const totalFetches = events.length;
    const saFetches = events.filter(e => !!e.apiKeyId).length;
    const humanFetches = totalFetches - saFetches;

    return NextResponse.json({
      summary: {
        totalFetches,
        saFetches,
        humanFetches,
        saPercentage: totalFetches > 0 ? Math.round((saFetches / totalFetches) * 100) : 0
      },
      topProjects,
      topActors,
      usageTimeline
    });

  } catch (error: any) {
    console.error("Usage Analytics API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
