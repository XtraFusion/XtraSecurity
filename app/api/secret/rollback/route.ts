import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import { triggerWebhooks } from "@/lib/webhook";
import { getUserProjectRole } from "@/lib/permissions";

/**
 * POST /api/secret/rollback
 * Restores a secret to a specific version from its history.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { secretId, targetVersion, changeReason } = await req.json();

    if (!secretId || !targetVersion) {
      return NextResponse.json(
        { error: "Missing required fields: secretId and targetVersion" },
        { status: 400 }
      );
    }

    // 1. Fetch the existing secret
    const secret = await prisma.secret.findUnique({
      where: { id: secretId },
      include: {
        project: true
      }
    });

    if (!secret) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 });
    }

    const projectId = secret.projectId;
    const environment = secret.environmentType;

    // 2. RBAC Checks
    const role = await getUserProjectRole(auth.userId, projectId);
    if (!role) {
      return NextResponse.json({ error: "Forbidden: No access to this project" }, { status: 403 });
    }

    // Security Constraint: Viewers cannot rollback
    if (role === "viewer") {
      return NextResponse.json({ error: "Forbidden: Viewers cannot rollback secrets" }, { status: 403 });
    }

    // Security Constraint: Developers cannot rollback in Production
    if (role === "developer" && (environment?.toLowerCase() === "production" || environment?.toLowerCase() === "prod")) {
      return NextResponse.json({ error: "Forbidden: Developers cannot rollback production secrets" }, { status: 403 });
    }

    // 3. Find the target version in history
    const history = Array.isArray(secret.history) ? (secret.history as any[]) : [];
    const targetEntry = history.find((h: any) => h.version === targetVersion);

    if (!targetEntry) {
      return NextResponse.json(
        { error: `Version ${targetVersion} not found in history` },
        { status: 404 }
      );
    }

    if (secret.version === targetVersion) {
      return NextResponse.json(
        { error: "Secret is already at the target version" },
        { status: 400 }
      );
    }

    // 4. Prepare the new value and version
    const newVersionNumber = (parseInt(secret.version || "1") + 1).toString();
    
    // The value in history might be a string (plain text) or an encrypted object/string.
    // Based on app/api/secret/route.ts, the main 'value' field is expected to be a String[]
    // where entry [0] is a JSON string of the encrypted object.
    
    let plainValue = "";
    let encryptedValueToStore: string[] = [];

    // Extract plain value for webhook and history metadata
    if (typeof targetEntry.value === "string") {
      plainValue = targetEntry.value;
    } else if (Array.isArray(targetEntry.value) && targetEntry.value.length > 0) {
      // It's likely already an encrypted array from a previous version
      const val = targetEntry.value[0];
      try {
        const parsed = JSON.parse(val);
        if (parsed.iv && parsed.encryptedData) {
          // It's encrypted! We should keep it as is or re-encrypt it? 
          // Best is to re-encrypt to have a fresh IV, but decrypting first is safer for validation.
          const { decrypt } = await import("@/lib/encription");
          plainValue = decrypt(parsed);
        } else {
          plainValue = val;
        }
      } catch (e) {
        plainValue = val;
      }
    }

    // Re-encrypt to ensure freshness of IV/AuthTag
    const reEncrypted = encrypt(plainValue);
    encryptedValueToStore = [JSON.stringify(reEncrypted)];

    // 5. Update the Database
    const newHistoryEntry = {
      version: newVersionNumber,
      value: plainValue, // Store plain text in history as per existing pattern? 
      // Actually, looking at PUT in api/secret/route.ts, it stores the plain text value in history.
      description: changeReason || `Rollback to version ${targetVersion}`,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.userId,
    };

    const updatedSecret = await prisma.secret.update({
      where: { id: secretId },
      data: {
        value: encryptedValueToStore,
        version: newVersionNumber,
        updatedBy: auth.userId,
        history: [newHistoryEntry, ...history],
      },
    });

    // 6. Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: "secret_rollback",
          entity: "secret",
          entityId: secretId,
          workspaceId: secret.project.workspaceId,
          ipAddress: req.headers.get("x-forwarded-for") || req.ip || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          changes: {
            projectId,
            environment,
            secretKey: secret.key,
            fromVersion: secret.version,
            toVersion: newVersionNumber,
            targetVersion: targetVersion,
            reason: changeReason || "Manual rollback via dashboard",
          },
        },
      });
    } catch (auditError) {
      console.error("[ROLLBACK API] Failed to create audit log:", auditError);
    }

    // 7. Trigger Webhooks
    try {
      await triggerWebhooks(projectId, "secret.rollback", {
        secretId,
        secretKey: secret.key,
        environment,
        fromVersion: secret.version,
        toVersion: newVersionNumber,
        targetVersion,
        user: auth.userId,
      });
    } catch (webhookError) {
      console.error("[ROLLBACK API] Webhook trigger failed:", webhookError);
    }

    console.log(`[ROLLBACK API] Successfully rolled back secret ${secret.key} (ID: ${secretId}) to version ${targetVersion}. New version: ${newVersionNumber}`);

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back to version ${targetVersion}`,
      version: newVersionNumber,
      secret: {
          id: updatedSecret.id,
          key: updatedSecret.key,
          version: updatedSecret.version
      }
    });

  } catch (error: any) {
    console.error("[ROLLBACK API] Critical error during rollback:", error);
    return NextResponse.json(
      { error: "Internal server error during rollback", details: error.message },
      { status: 500 }
    );
  }
}
