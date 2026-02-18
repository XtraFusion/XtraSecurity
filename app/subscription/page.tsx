import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { getRateLimitStats, Tier } from "@/lib/rate-limit";
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

    return (
        <DashboardLayout>
            <SubscriptionUI tier={tier} stats={stats} />
        </DashboardLayout>
    );
}
