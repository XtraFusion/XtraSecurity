import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/access-reviews - List pending reviews or review cycles
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch active reviews 
    // Ideally we have a ReviewCycle model, but for now we might mock or use a simple query
    // Let's assume we want to list Users and their roles for review
    
    const users = await prisma.user.findMany({
        include: {
            userRoles: {
                include: { project: true }
            }
        }
    });

    const reviews = users.map(u => ({
        userId: u.id,
        name: u.name,
        email: u.email,
        roles: u.userRoles.map(r => ({
            role: r.role,
            project: r.project?.name || "Global"
        })),
        lastLogin: u.updatedAt, // Approximate
        status: "pending_review"
    }));

    return NextResponse.json(reviews);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/access-reviews - Start a new review cycle (Audit)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Log the start of a review cycle
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "access_review_start",
                entity: "system",
                changes: { description: "Quarterly Access Review initiated" }
            }
        });

        return NextResponse.json({ success: true, message: "Access review cycle started" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
