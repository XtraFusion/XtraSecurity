import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
import prisma from '@/lib/db';
import { verifyAuth } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || !auth.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier } = await req.json();

    // Get the user ID
    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update their subscription tier and User account tier
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { tier: tier }
      }),
      prisma.userSubscription.updateMany({
        where: { userId: user.id, status: 'active' },
        data: { plan: tier }
      })
    ]);

    return NextResponse.json({ message: 'Plan updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
