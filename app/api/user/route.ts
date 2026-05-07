import { NextResponse, NextRequest } from "next/server";
import { verifyAuth } from "@/lib/server-auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
    // Try NextAuth session first (for web UI)
    let auth = await verifyAuth(req);
    
    // If no NextAuth session, try API token (for CLI/extension)
    if (!auth) {
        const authSession = await verifyAuth(req);
        if (!authSession?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        // Found valid API token - fetch user by email from token
        const user = await prisma.user.findUnique({
            where: { email: authSession.email },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                tier: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    }

    // Handle NextAuth session (original logic)
    if (!auth || !auth.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch fresh user data from DB
    const user = await prisma.user.findUnique({
        where: { email: auth.email },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            tier: true,
            // Add other fields needed by the frontend here
        }
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user,{status:200})
}