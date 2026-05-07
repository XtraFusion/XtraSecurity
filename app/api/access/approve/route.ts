import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withSecurity } from "@/lib/api-middleware";

// POST /api/access/approve
export const POST = withSecurity(async (req: NextRequest, _context: any, auth: any) => {
    // Role check: Only admin or high privileged user can approve
    const { requestId, decision } = await req.json(); // decision: "approved" | "rejected"
    
    if (!requestId || !decision) {
        return NextResponse.json({ error: "requestId and decision required" }, { status: 400 });
    }

    const request = await prisma.accessRequest.findUnique({ where: { id: requestId } });
    if (!request) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Enforce Workspace RBAC
    if (!request.workspaceId) {
         return NextResponse.json({ error: "Invalid request (missing workspaceId)" }, { status: 400 });
    }

    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(auth.userId, request.workspaceId);

    if (!role || (role !== "owner" && role !== "admin")) {
         return NextResponse.json({ error: "Forbidden: Only workspace admins can approve requests" }, { status: 403 });
    }

    // Enforce status transition rules
    if (decision === "revoked") {
        if (request.status !== "approved") {
            return NextResponse.json({ error: "Only approved requests can be revoked" }, { status: 400 });
        }
    } else if (request.status !== "pending") {
        return NextResponse.json({ error: `Request is already ${request.status}` }, { status: 400 });
    }

    const data: any = {
        status: decision,
        approvedBy: auth.userId, // Record the actor (approver or revoker)
        approvedAt: request.approvedAt || new Date() // Keep original approval time if revoking
    };

    if (decision === "approved") {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + request.duration);
        data.expiresAt = expiresAt;
    } else if (decision === "revoked") {
        data.expiresAt = new Date(); // Expire immediately
    }

    const updated = await prisma.accessRequest.update({
        where: { id: requestId },
        data: data
    });

    return NextResponse.json({
        success: true,
        message: `Request ${decision}`,
        status: updated.status,
        expiresAt: updated.expiresAt
    });
});
