import { NextResponse, NextRequest } from "next/server";
import { verifyAuth } from "@/lib/server-auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
    // Try NextAuth session first (for web UI)
    const auth = await verifyAuth(req);
    
    if (!auth?.email) {
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

export async function DELETE(req: NextRequest) {
    const auth = await verifyAuth(req);
    if (!auth?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Find user first to get ID
        const user = await prisma.user.findUnique({
            where: { email: auth.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Delete user (cascade delete should handle related records in schema, or they can be manually cleaned up)
        await prisma.user.delete({
            where: { id: user.id }
        });

        return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Account Deletion Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}