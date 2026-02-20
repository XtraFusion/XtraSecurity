import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasPermission, AccessReviewPermissions } from "@/lib/permissions";

// GET /api/access-reviews - List pending reviews or review cycles
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canRead = await hasPermission(session.user.id, AccessReviewPermissions.READ);
    if (!canRead) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Find the start of the current review cycle
    const lastCycle = await prisma.auditLog.findFirst({
        where: { action: "access_review_start" },
        orderBy: { timestamp: "desc" }
    });

    const cycleStartTime = lastCycle?.timestamp || new Date(0); // Default to beginning of time if no cycle started

    // 2. Fetch all users suitable for review (e.g., exclude the current admin or system users if needed)
    const users = await prisma.user.findMany({
        where: {
            NOT: {
                id: session.user.id // Optional: Don't review self? Or do. Let's keep it simple.
            }
        },
        include: {
            userRoles: {
                include: { project: true }
            },
            // Fetch reviews for this user that happened AFTER the cycle start
            reviewsReceived: {
                where: {
                    reviewedAt: {
                        gte: cycleStartTime
                    }
                },
                orderBy: { reviewedAt: "desc" },
                take: 1
            }
        }
    });

    // 3. Map to response format
    const reviews = users.map(u => {
        const latestReview = u.reviewsReceived[0];
        let status = "pending_review";
        if (latestReview) {
            status = latestReview.status; 
        }

        return {
            userId: u.id,
            name: u.name,
            email: u.email,
            roles: u.userRoles.map(r => ({
                role: r.role,
                project: r.project?.name || "Global"
            })),
            lastLogin: u.updatedAt, // Using updatedAt as proxy for now
            status
        };
    });

    return NextResponse.json(reviews);

  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/access-reviews - Start a new review cycle (Audit)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Check permission (START_CYCLE or WRITE)
        const canStart = await hasPermission(session.user.id, AccessReviewPermissions.START_CYCLE);
         // Fallback to WRITE if explicit START_CYCLE not found? Or just enforce START_CYCLE.
         // Let's allow WRITE to imply it for simplicity, or just check START_CYCLE.
         // Based on plan: START_CYCLE.
        if (!canStart) {
             // Optional: check for generic write too?
             const canWrite = await hasPermission(session.user.id, AccessReviewPermissions.WRITE);
             if (!canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Log the start of a review cycle
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "access_review_start",
                entity: "system",
                entityId: "system", 
                changes: { description: "Quarterly Access Review initiated" }
            }
        });

        return NextResponse.json({ success: true, message: "Access review cycle started" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/access-reviews - Submit a review decision
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const canWrite = await hasPermission(session.user.id, AccessReviewPermissions.WRITE);
        if (!canWrite) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { userId, decision } = body; // decision: "approve" | "revoke"

        if (!userId || !["approve", "revoke"].includes(decision)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const review = await prisma.accessReview.create({
            data: {
                userId,
                reviewerId: session.user.id,
                status: decision === "approve" ? "approved" : "revoked",
                notes: `Manual review by ${session.user.name}`
            }
        });

        // If revoked, perform revocation logic here (e.g. remove roles, disable user)
        // For now, we just log it.
        if (decision === "revoke") {
             await prisma.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: "access_revoked",
                    entity: "user",
                    entityId: userId,
                    changes: { description: "User access revoked during review" }
                }
            });
        }

        return NextResponse.json({ success: true, review });

    } catch (error: any) {
         console.error("Error submitting review:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
