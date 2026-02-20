import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hash } from "bcryptjs";

// GET /api/user/settings - Fetch current user settings
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                name: true,
                email: true,
                image: true,
                mfaEnabled: true,
                sessions: {
                    select: {
                        id: true,
                        expires: true,
                        // Add other session fields if available, e.g., ipAddress, userAgent if augmented
                    },
                    orderBy: { expires: "desc" },
                    take: 5
                }
            }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/user/settings - Update settings
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { type, data } = body;

        if (!type || !data) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

        if (type === "profile") {
            const { name } = data;
            const updatedUser = await prisma.user.update({
                where: { id: session.user.id },
                data: { name } // ONLY update name, never email
            });
            return NextResponse.json({ success: true, user: updatedUser });
        }

        if (type === "security") {
            const { mfaEnabled } = data; // password change disabled for now

            // Handle MFA Toggle
            if (typeof mfaEnabled === 'boolean') {
                 await prisma.user.update({
                    where: { id: session.user.id },
                    data: { mfaEnabled }
                });
            }
            
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid setting type" }, { status: 400 });

    } catch (error: any) {
        console.error("Settings update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
