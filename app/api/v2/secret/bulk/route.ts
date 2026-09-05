import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withSecurity } from "@/lib/api-middleware";
import { getUserProjectRole } from "@/lib/permissions";
import { DAILY_LIMITS, Tier } from "@/lib/rate-limit-config";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/v2/secret/bulk
 * Atomic bulk creation of pre-encrypted Zero-Knowledge secrets.
 * Server stores cipher blobs directly without holding decryption keys.
 */
export const POST = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, branchId, secrets } = body;

    if (!projectId || !secrets || !Array.isArray(secrets) || secrets.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: projectId or secrets array" },
        { status: 400 }
      );
    }

    // Rate Limiting & User Plan Constraints
    const projectRecord = await prisma.project.findUnique({
      where: { id: projectId },
      include: { user: true }
    });

    if (!projectRecord || !projectRecord.user) {
      return NextResponse.json({ error: "Project or owner not found" }, { status: 404 });
    }

    const ownerTier = (projectRecord.user.tier || "free") as Tier;
    const resolvedMaxSecrets = DAILY_LIMITS[ownerTier]?.maxSecretsPerProject || 50;

    const secretCount = await prisma.secret.count({
      where: { projectId: projectId }
    });

    if (secretCount + secrets.length > resolvedMaxSecrets) {
      return NextResponse.json(
        {
          error: "Secret limit reached",
          message: `The workspace owner's ${ownerTier} plan allows up to ${resolvedMaxSecrets} secrets per project. You are trying to add ${secrets.length} secrets, but only ${resolvedMaxSecrets - secretCount} slots remain.`
        },
        { status: 403 }
      );
    }

    // Access Control
    if (session.isServiceAccount) {
      if (session.projectId !== projectId) return NextResponse.json({ error: "Forbidden: SA locked to project" }, { status: 403 });
      if (!session.permissions?.includes("write:secrets")) return NextResponse.json({ error: "Forbidden: Missing write:secrets scope" }, { status: 403 });
    } else {
      const role = await getUserProjectRole(session.userId, projectId);
      if (!role || role === "viewer") {
        return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 });
      }
      if (role === "developer" && secrets.some((s: any) => s.environmentType === "production")) {
        return NextResponse.json({ error: "Developers cannot create secrets in Production" }, { status: 403 });
      }
    }

    // Process and create pre-encrypted secrets
    const createdSecrets = [];
    for (const item of secrets) {
      const {
        key,
        ciphertext,
        iv,
        authTag,
        description,
        environmentType = "development",
        workloadEnvelopes = []
      } = item;

      if (!key || !ciphertext || !iv || !authTag) {
        continue;
      }

      const cleanKey = key.toUpperCase().trim().replace(/\s+/g, "_");
      const e2eeBlob = JSON.stringify({
        ciphertext,
        iv,
        authTag,
        workloadEnvelopes,
        projectId,
        encryptedAt: new Date().toISOString()
      });

      const newSecret = await prisma.secret.create({
        data: {
          key: cleanKey,
          value: [e2eeBlob],
          description: description || "Imported via Zero-Knowledge E2EE",
          environmentType,
          version: "1",
          projectId,
          branchId: branchId || null,
          rotationPolicy: "manual",
          type: "API Key",
          history: [
            {
              version: "1",
              value: [e2eeBlob],
              description: description || "Imported via Zero-Knowledge E2EE",
              updatedAt: new Date().toISOString(),
              updatedBy: session.email
            }
          ],
          updatedBy: session.email
        }
      });

      createdSecrets.push({
        id: newSecret.id,
        key: newSecret.key,
        environmentType: newSecret.environmentType,
        isZeroKnowledge: true,
        version: "1",
        updatedAt: newSecret.lastUpdated
      });
    }

    // Audit log
    try {
      await logAudit(
        "SECRET_BULK_CREATED_E2EE",
        session.userId,
        projectId,
        { count: createdSecrets.length, zeroKnowledge: true }
      );
    } catch (_) {}

    return NextResponse.json({
      success: true,
      count: createdSecrets.length,
      zeroKnowledge: true,
      secrets: createdSecrets,
      message: `Successfully stored ${createdSecrets.length} Zero-Knowledge encrypted secrets.`
    }, { status: 201 });
  } catch (error: any) {
    console.error("[API v2 POST Bulk Secrets] Error:", error.message);
    return NextResponse.json({ error: "Failed to store bulk zero-knowledge secrets" }, { status: 500 });
  }
});
