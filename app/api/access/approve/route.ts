import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// POST /api/access/approve
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only admin or high privileged user can approve
    // For MVP, we assume any authenticated user with "admin" role
    // Or anyone for demo purposes? Let's stick to "admin" strictly if role exists.
    const { requestId, decision } = await req.json(); // decision: "approved" | "rejected"
    
    if (!requestId || !decision) {
        return NextResponse.json({ error: "requestId and decision required" }, { status: 400 });
    }

    const request = await prisma.accessRequest.findUnique({ where: { id: requestId } });
    if (!request) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Enforce Workspace RBAC
    // The request has a workspaceId. The approver must be Admin/Owner of THAT workspace.
    // If workspaceId is missing (legacy?), fallback to global admin check or deny.
    if (!request.workspaceId) {
         // Fallback or stricter check
         return NextResponse.json({ error: "Invalid request (missing workspaceId)" }, { status: 400 });
    }

    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(auth.userId, request.workspaceId);

    if (!role || (role !== "owner" && role !== "admin")) {
         await import("@/lib/permissions"); // Ensure import? (already done)
         return NextResponse.json({ error: "Forbidden: Only workspace admins can approve requests" }, { status: 403 });
    }

    if (request.status !== "pending") {
        return NextResponse.json({ error: `Request is already ${request.status}` }, { status: 400 });
    }

    const data: any = {
        status: decision,
        approvedBy: auth.userId,
        approvedAt: new Date()
    };

    if (decision === "approved") {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + request.duration);
        data.expiresAt = expiresAt;
    }

    const updated = await prisma.accessRequest.update({
        where: { id: requestId },
        data: data
    });

    return NextResponse.json({
        success: true,
        message: `Request ${decision}`,
        expiresAt: updated.expiresAt
    });

  } catch (error: any) {
    console.error("Access approval error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
