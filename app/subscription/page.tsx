import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { getRateLimitStats, Tier } from "@/lib/rate-limit";
import { DAILY_LIMITS } from "@/lib/rate-limit-config";
import { redirect } from "next/navigation";
import SubscriptionUI from "./subscription-ui";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function SubscriptionPage() {
    const session = await getServerSession(authOptions);

    // Redirect if not authenticated
    if (!session || !session.user?.email) {
        redirect('/api/auth/signin?callbackUrl=/subscription');
    }

    // Fetch user tier from DB
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, tier: true }
    });

    if (!user) {
        redirect('/api/auth/signin');
    }

    const tier = (user.tier || 'free') as Tier;

    // Get Usage Stats
    const stats = await getRateLimitStats(user.id, tier);

    // Get Resource Usage Stats
    const workspacesCount = await prisma.workspace.count({
        where: { createdBy: user.id }
    });

    const teamsCount = await prisma.team.count({
        where: { createdBy: user.id }
    });

    // To find the highest number of projects in any of the user's workspaces
    const projectsGroups = await prisma.project.groupBy({
        by: ['workspaceId'],
        _count: { id: true },
        where: { workspace: { createdBy: user.id } }
    });
    const maxProjects = projectsGroups.length > 0
        ? Math.max(...projectsGroups.map(g => g._count.id))
        : 0;

    const limits = DAILY_LIMITS[tier];
    const resourceUsage = {
        workspaces: { used: workspacesCount, limit: limits.maxWorkspaces },
        teams: { used: teamsCount, limit: limits.maxTeams },
        projects: { used: maxProjects, limit: limits.maxProjectsPerWorkspace },
    };

    return (
        <DashboardLayout>
            <SubscriptionUI tier={tier} stats={stats} resourceUsage={resourceUsage} />
        </DashboardLayout>
    );
}
