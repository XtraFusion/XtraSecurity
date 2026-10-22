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
    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map((update: any) =>
          prisma.secret.update({
            where: { id: update.id },
            data: {
              value: update.value,
              history: update.history, // Overwrite history with re-encrypted history
              updatedBy: session.email || "system",
            },
          })
        )
      );
    }

    // Persist or update the vault verification sentinel
    const { sentinel } = body;
    if (sentinel) {
      const sentinelIdentifier = "__xtra_vault_sentinel__";
      const sentinelStr = typeof sentinel === "string" ? sentinel : JSON.stringify(sentinel);
      const existingSentinel = await prisma.secret.findFirst({
        where: { projectId, ['key']: sentinelIdentifier }
      });

      if (existingSentinel) {
        await prisma.secret.update({
          where: { id: existingSentinel.id },
          data: {
            value: [sentinelStr],
            updatedBy: session.email || "system",
            history: [
              ...(Array.isArray(existingSentinel.history) ? existingSentinel.history : []),
              {
                version: String(Number(existingSentinel.version || 1) + 1),
                value: [sentinelStr],
                description: "Rotated vault sentinel",
                updatedAt: new Date().toISOString(),
                updatedBy: session.email || "system",
              }
            ]
          }
        });
      } else {
        await prisma.secret.create({
          data: {
            ['key']: sentinelIdentifier,
            value: [sentinelStr],
            description: "Zero-Knowledge Vault Verification Sentinel",
            environmentType: "system",
            version: "1",
            type: "Sentinel",
            rotationPolicy: "manual",
            projectId,
            branchId: null,
            updatedBy: session.email || "system",
            history: [
              {
                version: "1",
                value: [sentinelStr],
                description: "Initial vault sentinel",
                updatedAt: new Date().toISOString(),
                updatedBy: session.email || "system",
              }
            ]
          }
        });
      }
    }

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
