import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";

// PATCH /api/access-requests/[id] -> Approve/Deny
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ideally check if user is admin or project owner. For MVP, check global admin.
    if (session.user.role !== "admin") {
        // TODO: Add project-level permission check here
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const request = await prisma.accessRequest.findUnique({
      where: { id },
      include: {
        secret: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "pending") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 });
    }

    let expiresAt = null;

    if (status === "approved") {
      expiresAt = new Date(Date.now() + request.duration * 60 * 1000); // duration in minutes

      // Grant permissions
      if (request.secretId && request.secret) {
        // Add user ID to secret permissions if not already there
        const currentPermissions = request.secret.permission || [];
        if (!currentPermissions.includes(request.userId)) {
          await prisma.secret.update({
            where: { id: request.secretId },
            data: {
              permission: {
                push: request.userId,
              },
            },
          });
        }
      } else if (request.projectId) {
        // TODO: Grant project-wide role (e.g. temporary member)
        // For now, simpler to just focus on secret-level JIT.
      }
    }

    const updatedRequest = await prisma.accessRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: session.user.id,
        approvedAt: new Date(),
        expiresAt,
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Failed to update access request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
