import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withSecurity } from '@/lib/api-middleware';

// Fetch all users and their subscriptions
export const GET = withSecurity(async (req, ctx, session) => {
    // 1. Authorization
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            include: {
                userSubscription: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Optionally strip sensitive data like password if it's there
        const safeUsers = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            tier: u.tier,
            role: u.role,
            createdAt: u.createdAt,
            userSubscription: u.userSubscription
        }));

        return NextResponse.json({ users: safeUsers });
    } catch (error: any) {
        console.error("Admin Fetch Users Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});

// Modify a user's subscription
export const PUT = withSecurity(async (req, ctx, session) => {
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { userId, action } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: "userId and action are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userSubscription: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let plan = user.userSubscription?.plan || "free";
        let status = user.userSubscription?.status || "active";
        let workspaceLimit = user.userSubscription?.workspaceLimit || 3;
        
        let endDate = user.userSubscription?.endDate ? new Date(user.userSubscription.endDate) : new Date();

        if (action === 'activate_pro') {
            plan = "pro";
            status = "active";
            workspaceLimit = 10;
            // Set end date to 1 year from now if it was expired or set new
            const now = new Date();
            if (endDate < now) {
                endDate = now;
            }
            endDate.setFullYear(endDate.getFullYear() + 1);
            
            // Also update the User's tier
            await prisma.user.update({
                where: { id: userId },
                data: { tier: "pro" }
            });
        } 
        else if (action === 'deactivate') {
            plan = "free";
            status = "inactive";
            workspaceLimit = 3;
            // Can optionally truncate endDate or let it expire
            endDate = new Date(); // expired
            
            // Also update the User's tier
            await prisma.user.update({
                where: { id: userId },
                data: { tier: "free" }
            });
        }
        else if (action === 'renew') {
            // Add 1 year
            endDate.setFullYear(endDate.getFullYear() + 1);
            status = "active";
        }
        else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const upsertedSub = await prisma.userSubscription.upsert({
            where: { userId: userId },
            update: {
                plan,
                status,
                workspaceLimit,
                endDate
            },
            create: {
                userId,
                plan,
                status,
                workspaceLimit,
                endDate
            }
        });

        return NextResponse.json({ message: "Subscription updated", subscription: upsertedSub });

    } catch (error: any) {
        console.error("Admin Modify Subscription Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});
