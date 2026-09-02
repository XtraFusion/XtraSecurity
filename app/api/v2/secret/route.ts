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

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Role verification
    if (session.isServiceAccount) {
      if (session.projectId !== projectId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else {
      const role = await getUserProjectRole(session.userId, projectId);
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
        if (typeof rawVal === 'string' && rawVal.startsWith('{')) {
          e2eePayload = JSON.parse(rawVal);
        }
      } catch (e) {}

      return {
        id: secret.id,
        key: secret.key,
        projectId: secret.projectId,
        environmentType: secret.environmentType,
        isZeroKnowledge: true,
        encryptedPayload: e2eePayload || {
          ciphertext: secret.value[0] || "",
          iv: null,
          authTag: null
        },
        version: secret.version,
        updatedAt: secret.updatedAt
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

    const cleanKey = key.toUpperCase().trim().replace(/\s+/g, '_');

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
      encryptedAt: new Date().toISOString()
    });

    const newSecret = await prisma.secret.create({
      data: {
        key: cleanKey,
        value: [e2eeBlob],
        description: description || '',
        environmentType,
        version: "1",
        projectId,
        branchId: branchId || null,
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
    } catch (e) {}

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
