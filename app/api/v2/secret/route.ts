import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withSecurity } from "@/lib/api-middleware";
import { getUserProjectRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/v2/secret
 * Returns raw zero-knowledge encrypted ciphertext blobs + workload key envelopes.
 * The server DOES NOT decrypt the secret; client/workload decrypts locally.
 */
export const GET = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const branchId = searchParams.get("branchId");
    const secretId = searchParams.get("id");

    if (!projectId && !secretId) {
      return NextResponse.json({ error: "Project ID or Secret ID is required" }, { status: 400 });
    }

    // Single secret fetch
    if (secretId) {
      const secret = await prisma.secret.findUnique({
        where: { id: secretId },
        include: { project: true }
      });

      if (!secret) {
        return NextResponse.json({ error: "Secret not found" }, { status: 404 });
      }

      if (session.isServiceAccount) {
        if (session.projectId !== secret.projectId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      } else {
        const role = await getUserProjectRole(session.userId, secret.projectId);
        if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      let e2eePayload: any = null;
      try {
        const rawVal = secret.value[0];
        if (typeof rawVal === "string" && rawVal.startsWith("{")) {
          e2eePayload = JSON.parse(rawVal);
        }
      } catch (_) {}

      return NextResponse.json({
        success: true,
        protocol: "X25519-AES-256-GCM",
        zeroKnowledge: true,
        secret: {
          id: secret.id,
          key: secret.key,
          projectId: secret.projectId,
          environmentType: secret.environmentType,
          description: secret.description,
          isZeroKnowledge: true,
          encryptedPayload: e2eePayload || {
            ciphertext: secret.value[0] || "",
            iv: null,
            authTag: null
          },
          version: secret.version,
          updatedAt: secret.lastUpdated
        }
      });
    }

    // Role verification for project
    if (session.isServiceAccount) {
      if (session.projectId !== projectId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else {
      const role = await getUserProjectRole(session.userId, projectId!);
      if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const query: any = { projectId };
    if (branchId) query.branchId = branchId;

    const secrets = await prisma.secret.findMany({
      where: query,
      include: {
        project: true
      }
    });

    // Format output as raw Zero-Knowledge E2EE payloads
    const e2eeSecrets = secrets.map((secret) => {
      let e2eePayload: any = null;
      try {
        const rawVal = secret.value[0];
        if (typeof rawVal === "string" && rawVal.startsWith("{")) {
          e2eePayload = JSON.parse(rawVal);
        }
      } catch (_) {}

      return {
        id: secret.id,
        key: secret.key,
        projectId: secret.projectId,
        environmentType: secret.environmentType,
        description: secret.description,
        isZeroKnowledge: true,
        encryptedPayload: e2eePayload || {
          ciphertext: secret.value[0] || "",
          iv: null,
          authTag: null
        },
        version: secret.version,
        updatedAt: secret.lastUpdated
      };
    });

    return NextResponse.json({
      success: true,
      protocol: "X25519-AES-256-GCM",
      zeroKnowledge: true,
      secrets: e2eeSecrets
    });
  } catch (error: any) {
    console.error("[API v2 GET Secret] Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch zero-knowledge secrets" }, { status: 500 });
  }
});

/**
 * POST /api/v2/secret
 * Receives pre-encrypted payload blobs `{ key, ciphertext, iv, authTag, projectId, environmentType }`
 * Stores encrypted blob directly in database without server-side decryption key.
 */
export const POST = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      key,
      ciphertext,
      iv,
      authTag,
      description,
      environmentType,
      projectId,
      branchId,
      workloadEnvelopes = []
    } = body;

    if (!key || !ciphertext || !iv || !authTag || !projectId || !environmentType) {
      return NextResponse.json(
        { error: "Missing required E2EE fields (key, ciphertext, iv, authTag, projectId, environmentType)" },
        { status: 400 }
      );
    }

    const cleanKey = key.toUpperCase().trim().replace(/\s+/g, "_");

    // Access Control
    if (!session.isServiceAccount) {
      const role = await getUserProjectRole(session.userId, projectId);
      if (!role || role === "viewer") {
        return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 });
      }
    }

    // Wrap zero-knowledge blob as JSON string inside secret.value array
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
        description: description || "",
        environmentType,
        version: "1",
        projectId,
        branchId: branchId || null,
        type: "API Key",
        rotationPolicy: "manual",
        updatedBy: session.email,
        history: [
          {
            version: "1",
            value: [e2eeBlob],
            updatedAt: new Date().toISOString(),
            updatedBy: session.email
          }
        ]
      }
    });

    // Audit Log
    try {
      await logAudit(
        "SECRET_CREATED_E2EE",
        session.userId,
        projectId,
        { secretId: newSecret.id, key: newSecret.key, environment: environmentType, zeroKnowledge: true }
      );
    } catch (_) {}

    return NextResponse.json(
      {
        success: true,
        id: newSecret.id,
        key: newSecret.key,
        zeroKnowledge: true,
        message: "Secret encrypted on client and saved successfully without server-side decryption key."
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API v2 POST Secret] Error:", error.message);
    return NextResponse.json({ error: "Failed to store zero-knowledge secret" }, { status: 500 });
  }
});

/**
 * PUT /api/v2/secret
 * Updates an existing secret with pre-encrypted ciphertext blob.
 * Appends new encrypted payload to version history without server-side decryption.
 */
export const PUT = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const body = await request.json();
    const secretId = searchParams.get("id") || body.id;

    const {
      ciphertext,
      iv,
      authTag,
      description,
      environmentType,
      changeReason,
      workloadEnvelopes = []
    } = body;

    if (!secretId) {
      return NextResponse.json({ error: "Secret ID is required" }, { status: 400 });
    }

    if (!ciphertext || !iv || !authTag) {
      return NextResponse.json(
        { error: "Missing required E2EE fields (ciphertext, iv, authTag)" },
        { status: 400 }
      );
    }

    const existingSecret = await prisma.secret.findUnique({
      where: { id: secretId }
    });

    if (!existingSecret) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 });
    }

    // Role check
    if (!session.isServiceAccount) {
      const role = await getUserProjectRole(session.userId, existingSecret.projectId);
      if (!role || role === "viewer") {
        return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 });
      }
    }

    const nextVersion = (parseInt(existingSecret.version || "1", 10) + 1).toString();

    const e2eeBlob = JSON.stringify({
      ciphertext,
      iv,
      authTag,
      workloadEnvelopes,
      projectId: existingSecret.projectId,
      encryptedAt: new Date().toISOString()
    });

    const currentHistory = Array.isArray(existingSecret.history) ? [...existingSecret.history] : [];
    currentHistory.push({
      version: nextVersion,
      value: [e2eeBlob],
      updatedAt: new Date().toISOString(),
      updatedBy: session.email,
      changeReason: changeReason || "Zero-Knowledge client update"
    });

    const updated = await prisma.secret.update({
      where: { id: secretId },
      data: {
        value: [e2eeBlob],
        version: nextVersion,
        history: currentHistory,
        description: description !== undefined ? description : existingSecret.description,
        environmentType: environmentType || existingSecret.environmentType,
        updatedBy: session.email
      }
    });

    try {
      await logAudit(
        "SECRET_UPDATED_E2EE",
        session.userId,
        existingSecret.projectId,
        {
          secretId: updated.id,
          key: updated.key,
          version: nextVersion,
          changeReason: changeReason || "Zero-Knowledge client update",
          zeroKnowledge: true
        }
      );
    } catch (_) {}

    return NextResponse.json({
      success: true,
      id: updated.id,
      key: updated.key,
      version: nextVersion,
      zeroKnowledge: true,
      message: "Secret updated successfully on client with Zero-Knowledge encryption."
    });
  } catch (error: any) {
    console.error("[API v2 PUT Secret] Error:", error.message);
    return NextResponse.json({ error: "Failed to update zero-knowledge secret" }, { status: 500 });
  }
});

/**
 * DELETE /api/v2/secret
 * Securely deletes a secret with RBAC verification and zero-knowledge audit logging.
 */
export const DELETE = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let secretId = searchParams.get("id");
    if (!secretId) {
      try {
        const body = await request.json();
        secretId = body.id;
      } catch (_) {}
    }

    if (!secretId) {
      return NextResponse.json({ error: "Secret ID is required" }, { status: 400 });
    }

    const secret = await prisma.secret.findUnique({
      where: { id: secretId }
    });

    if (!secret) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 });
    }

    // Role check
    if (!session.isServiceAccount) {
      const role = await getUserProjectRole(session.userId, secret.projectId);
      if (!role || role === "viewer") {
        return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 });
      }
    }

    await prisma.secret.delete({
      where: { id: secretId }
    });

    try {
      await logAudit(
        "SECRET_DELETED_E2EE",
        session.userId,
        secret.projectId,
        { secretId: secret.id, key: secret.key, zeroKnowledge: true }
      );
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: "Secret deleted successfully",
      zeroKnowledge: true
    });
  } catch (error: any) {
    console.error("[API v2 DELETE Secret] Error:", error.message);
    return NextResponse.json({ error: "Failed to delete zero-knowledge secret" }, { status: 500 });
  }
});
