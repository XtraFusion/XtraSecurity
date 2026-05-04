import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { getUserProjectRole, invalidateUserRbacCache } from "@/lib/permissions";

/**
 * PATCH /api/access-requests/[id]
 * Approves or Rejects a JIT access request.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!["approved", "rejected", "revoked", "expired"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // 1. Fetch the request
    const request = await prisma.accessRequest.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } }
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // 2. Authorization Check
    const projectId = request.projectId;
    if (!projectId) {
        return NextResponse.json({ error: "Missing project context" }, { status: 500 });
    }

    const role = await getUserProjectRole(session.user.id, projectId);
    const isProjectAdmin = role === "owner" || role === "admin";
    const isGlobalAdmin = session.user.role === "admin";

    // You can only approve/reject if you are an admin for the project or global admin
    if (!isProjectAdmin && !isGlobalAdmin) {
      return NextResponse.json({ error: "Forbidden: You cannot process requests for this project" }, { status: 403 });
    }

    // 3. Process the Status
    let expiresAt = request.expiresAt;
    
    if (status === "approved" && request.status === "pending") {
      // Calculate expiry based on requested duration (minutes)
      expiresAt = new Date(Date.now() + request.duration * 60 * 1000);
      
      console.log(`[JIT] Request ${id} approved by ${session.user.email} for user ${request.user.email}. Expires at: ${expiresAt.toISOString()}`);
    }

    const updatedRequest = await prisma.accessRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: status === "approved" ? session.user.id : undefined,
        approvedAt: status === "approved" ? new Date() : undefined,
        expiresAt,
      },
    });

    // Invalidate cache for the user who requested access
    await invalidateUserRbacCache(request.userId);

    // 4. Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `jit_request_${status}`,
          entity: "access_request",
          entityId: id,
          workspaceId: request.workspaceId,
          changes: {
            requestUserId: request.userId,
            projectId: request.projectId,
            secretIds: request.secretIds,
            duration: request.duration,
            expiresAt: expiresAt?.toISOString(),
            reason: request.reason
          }
        }
      });
    } catch (e) {
      console.error("[JIT] Failed to log audit:", e);
    }

    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    console.error("Failed to update access request:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
