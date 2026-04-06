import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

// GET /api/access/list
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "my"; // "my" requests or "pending" approvals
    const workspaceId = url.searchParams.get("workspaceId");

    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(auth.userId, workspaceId || "");

    const where: any = {};

    if (mode === "pending") {
        // Only admins can see pending approvals
        if (!role || (role !== "owner" && role !== "admin")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        where.status = "pending";
        if (workspaceId) {
            where.OR = [
                { workspaceId: workspaceId },
                { project: { workspaceId: workspaceId } }
            ];
        }
    } else if (mode === "history") {
        // Only admins can see full history
        if (!role || (role !== "owner" && role !== "admin")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        where.status = { in: ["approved", "rejected", "revoked", "expired"] };
        if (workspaceId) {
            where.OR = [
                { workspaceId: workspaceId },
                { project: { workspaceId: workspaceId } }
            ];
        }
    } else if (mode === "approved") {
        // Show currently active (approved) requests — scoped to workspace
        where.status = "approved";
        // Filter out expired ones in the query if possible, or handle in JS
        where.expiresAt = { gte: new Date() };
        
        if (workspaceId) {
            where.OR = [
                { workspaceId: workspaceId },
                { project: { workspaceId: workspaceId } }
            ];
        }
    } else {
        // Show MY requests — no workspace filter needed (JIT users may not be in workspace)
        where.userId = auth.userId;
    }

    const requests = await prisma.accessRequest.findMany({
        where,
        orderBy: { requestedAt: "desc" },
        include: { 
            user: { select: { email: true, name: true } }, 
            secret: { select: { key: true } } 
        }
    });

    return NextResponse.json(requests);

  } catch (error: any) {
    console.error("Access list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
