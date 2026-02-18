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

    const where: any = {};

    if (workspaceId) {
        where.OR = [
            { workspaceId: workspaceId },
            { project: { workspaceId: workspaceId } }
        ];
    }

    if (mode === "pending") {
        // Show pending requests for admin
        where.status = "pending";
    } else if (mode === "approved") {
        // Show approved requests
        where.status = "approved";
    } else {
        // Show my requests
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
