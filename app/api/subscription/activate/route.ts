import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/api-middleware';
import prisma from '@/lib/db';
import { Tier } from '@/lib/rate-limit';

export const POST = withSecurity(async (req: NextRequest, ctx: any, session: any) => {
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { tier } = await req.json();

        if (!['free', 'pro', 'enterprise'].includes(tier)) {
            return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
        }

        const userId = session.userId;

        // 1. Update User Tier
        await prisma.user.update({
            where: { id: userId },
            data: { tier: tier }
        });

        // 2. Update or Create UserSubscription record
        // Default limits based on tier
        const limits: Record<Tier, number> = {
            free: 3,
            pro: 10,
            enterprise: 100
        };

        const oneYear = 1000 * 60 * 60 * 24 * 365;

        await prisma.userSubscription.upsert({
            where: { userId: userId },
            update: {
                plan: tier,
                workspaceLimit: limits[tier as Tier],
                status: "active",
                updatedAt: new Date()
            },
            create: {
                userId: userId,
                plan: tier,
                workspaceLimit: limits[tier as Tier],
                status: "active",
                startDate: new Date(),
                endDate: new Date(Date.now() + oneYear)
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: `Successfully upgraded to ${tier} plan`,
            tier: tier
        });

    } catch (error: any) {
        console.error("Subscription Activation Error:", error);
        return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 });
    }
});
