import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { createNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

// POST /api/jit/claim — Consume a JIT link and create an access request
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const jitLink = await prisma.jitLink.findUnique({
      where: { token },
    });

    if (!jitLink) {
      return NextResponse.json({ error: "JIT link not found" }, { status: 404 });
    }

    // Validate link is still usable
    if (new Date() > jitLink.expiresAt) {
      return NextResponse.json({ error: "This JIT link has expired" }, { status: 410 });
    }
    if (jitLink.isRevoked) {
      return NextResponse.json({ error: "This JIT link has been revoked" }, { status: 410 });
    }
    if (jitLink.usedCount >= jitLink.maxUses) {
      return NextResponse.json({ error: "This JIT link has reached its usage limit" }, { status: 410 });
    }

    // Can't claim your own link
    if (jitLink.createdBy === auth.userId) {
      return NextResponse.json({ error: "You cannot claim your own JIT link" }, { status: 400 });
    }

    // Note: No workspace membership check here — the JIT token itself is the
    // authorization. Any authenticated user with a valid token can submit a
    // request, which still requires admin/owner approval before access is granted.

    // Check if user already has a pending request from this JIT link
    const existingRequest = await prisma.accessRequest.findFirst({
      where: {
        userId: auth.userId,
        projectId: jitLink.projectId,
        status: "pending",
      },
    });

    if (existingRequest) {
      return NextResponse.json({
        error: "You already have a pending access request for this project",
        requestId: existingRequest.id,
      }, { status: 409 });
    }

    // Build reason from JIT label + scope
    const scopeParts: string[] = [];
    if (jitLink.environment) scopeParts.push(`env: ${jitLink.environment}`);
    if (jitLink.branchId) scopeParts.push(`branch scoped`);
    if (jitLink.secretIds.length > 0) scopeParts.push(`${jitLink.secretIds.length} specific secret(s)`);
    const scopeStr = scopeParts.length > 0 ? ` [${scopeParts.join(", ")}]` : "";
    const reason = `JIT Link: ${jitLink.label || "Shared access link"}${scopeStr}`;

    // Create the access request
    const accessRequest = await prisma.accessRequest.create({
      data: {
        userId: auth.userId,
        projectId: jitLink.projectId,
        secretIds: jitLink.secretIds, // Populating the array of allowed secret IDs
        reason,
        duration: jitLink.duration,
        status: "pending",
        workspaceId: jitLink.workspaceId,
        requestedAt: new Date(),
      },
    });

    // Increment usage count
    await prisma.jitLink.update({
      where: { id: jitLink.id },
      data: { usedCount: { increment: 1 } },
    });

    try {
      await logAudit(
        "JIT_LINK_CLAIMED",
        auth.userId,
        jitLink.projectId,
        { tokenId: jitLink.id, requestId: accessRequest.id }
      );
    } catch (e) {
      console.error("Audit log failed:", e);
    }

    // Notify workspace admins
    const project = await prisma.project.findUnique({
      where: { id: jitLink.projectId },
      select: { name: true, userId: true, workspaceId: true },
    });

    if (project) {
      // Notify project owner
      const owner = await prisma.user.findUnique({
        where: { id: project.userId },
        select: { id: true, email: true },
      });

      if (owner) {
        const requestUser = await prisma.user.findUnique({
          where: { id: auth.userId },
          select: { name: true, email: true },
        });

        await createNotification(
          owner.id,
          owner.email!,
          "JIT Access Request",
          `${requestUser?.name || requestUser?.email} requested read-only access to "${project.name}"`,
          `A JIT link was used to request ${jitLink.duration}-minute read-only access. Review in Access Requests.`,
          "info"
        );
      }
    }

    return NextResponse.json({
      success: true,
      requestId: accessRequest.id,
      status: "pending",
      message: "Access request submitted. Awaiting admin/owner approval.",
      duration: jitLink.duration,
      accessLevel: jitLink.accessLevel,
    });
  } catch (error: any) {
    console.error("JIT claim error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
