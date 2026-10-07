import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-middleware";
import prisma from "@/lib/db";
import { getUserProjectRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

// POST /api/secret/rotate - Bulk update secrets for master passphrase rotation
export const POST = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, updates } = body;

    if (!projectId || !updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "projectId and updates array are required" }, { status: 400 });
    }

    // Access Control
    if (session.isServiceAccount) {
      return NextResponse.json({ error: "Service accounts cannot rotate master keys" }, { status: 403 });
    }

    const role = await getUserProjectRole(session.userId, projectId);
    if (!role || (role !== "owner" && role !== "admin")) {
      return NextResponse.json({ error: "Only project owners or admins can rotate the master key" }, { status: 403 });
    }

    // Process updates in a transaction
    await prisma.$transaction(
      updates.map((update: any) =>
        prisma.secret.update({
          where: { id: update.id, projectId: projectId },
          data: {
            value: update.value,
            history: update.history, // Overwrite history with re-encrypted history
            updatedBy: session.email,
          },
        })
      )
    );

    // Audit Logging
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    try {
      await logAudit(
        "PROJECT_MASTER_KEY_ROTATED",
        session.userId,
        projectId,
        { rotatedSecretsCount: updates.length },
        project?.workspaceId
      );
    } catch (e) {
      console.error("[SecretRotate] Audit log failed:", e);
    }

    return NextResponse.json({ success: true, count: updates.length }, { status: 200 });
  } catch (error: any) {
    console.error("[SecretRotate] Failed to rotate secrets:", error);
    return NextResponse.json(
      { error: "Failed to rotate secrets", message: error.message },
      { status: 500 }
    );
  }
});
