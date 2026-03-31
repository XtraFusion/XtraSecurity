import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getRateLimitStats, Tier } from "@/lib/rate-limit";
import { getDailyUsageCount } from "@/lib/usage";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Fetch user tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true }
    });

    const tier = (user?.tier || "free") as Tier;

    // 2. Resource usage
    const workspacesCount = await prisma.workspace.count({
        where: { createdBy: userId }
    });

    const teamsCount = await prisma.team.count({
        where: { createdBy: userId }
    });

    // Total projects across ALL of the user's workspaces
    const totalProjects = await prisma.project.count({
        where: { workspace: { createdBy: userId } }
    });

    const totalSecrets = await prisma.secret.count({
        where: { project: { workspace: { createdBy: userId } } }
    });

    // 3. API Usage
    const stats = await getRateLimitStats(userId, tier);
    const dailyCount = await getDailyUsageCount(userId);

    // 4. Return summary
    const { DAILY_LIMITS } = await import("@/lib/rate-limit-config");
    const limits = DAILY_LIMITS[tier];

    return NextResponse.json({
      workspaces: { used: workspacesCount, limit: limits.maxWorkspaces },
      projects: { used: totalProjects, limit: limits.maxProjectsPerWorkspace * limits.maxWorkspaces }, // Approx total limit
      secrets: { used: totalSecrets, limit: limits.maxSecretsPerProject * totalProjects || 50 },
      dailyRequests: { used: dailyCount, limit: stats.limit }
    });

  } catch (error: any) {
    console.error("[api/subscription/usage] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
