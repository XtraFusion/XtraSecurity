import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/api-middleware';
import prisma from '@/lib/db';

export const POST = withSecurity(async (req: NextRequest, ctx: any, session: any) => {
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier } = await req.json();

    if (!['free', 'pro', 'enterprise'].includes(tier)) {
        return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // SIMULATION: In a real app, you would create a Stripe Checkout Session here.
    // We'll return a simulated checkout URL.
    
    const checkoutUrl = `/subscription/success?tier=${tier}`;

    return NextResponse.json({ url: checkoutUrl });
});
