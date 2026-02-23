import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt, encrypt } from "@/lib/encription"; // Typo in original file path, keeping consistency
import { triggerWebhooks } from "@/lib/webhook";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; env: string; key: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawParams = await params;
    const { projectId, env } = rawParams;
    const keyArray = Array.isArray(rawParams.key) ? rawParams.key : [rawParams.key];
    const key = decodeURIComponent(keyArray.join('/'));
    
    console.log("==== HISTORY ENDPOINT HIT ====");
    console.log(`Project: ${projectId}, Env: ${env}, Key: ${key}`);

    // Verify Project Access using RBAC
    const { getUserProjectRole } = await import("@/lib/permissions");
    const role = await getUserProjectRole(auth.userId, projectId);
    if (!role) {
      return NextResponse.json({ error: "Forbidden: No access to this project" }, { status: 403 });
    }

    const secret = await prisma.secret.findFirst({
        where: { projectId, environmentType: env, key }
    });

    if (!secret) return NextResponse.json({ error: "Secret not found" }, { status: 404 });

    // Return history
    // We should decrypt values or keep them encrypted? 
    // Usually history should be viewable, so let's decrypt if the user has access.
    // However, for security, maybe we only show metadata unless explicitly requested?
    // Let's return full details for now as the user likely wants to see what the value was.
    
    const history = Array.isArray(secret.history) ? secret.history : [];

    // Fetch user details for all unique updateBy IDs
    const userIds = Array.from(new Set(history.map((h: any) => h.updatedBy).filter(Boolean))) as string[];
    // Filter out invalid ObjectIds (e.g., if emails were accidentally stored) to prevent Prisma/MongoDB BSON errors
    const validObjectIds = userIds.filter(id => /^[a-fA-F0-9]{24}$/.test(id));
    
    let userMap = new Map();
    if (validObjectIds.length > 0) {
        const users = await prisma.user.findMany({
            where: { id: { in: validObjectIds } },
            select: { id: true, email: true, name: true }
        });
        userMap = new Map(users.map(u => [u.id, u]));
    }
    
    // Format history for frontend
    const formattedHistory = history.map((h: any) => {
        let value = "";
        try {
            if (h.value && h.value.length > 0) {
                 const raw = h.value[0];
                 const parsed = JSON.parse(raw);
                 if (parsed.iv && parsed.encryptedData) {
                     value = decrypt(parsed);
                 } else {
                     value = raw;
                 }
            }
        } catch (e) {
            value = "Error decrypting or legacy format";
        }

        const user = userMap.get(h.updatedBy);

        return {
            version: h.version,
            updatedAt: h.updatedAt,
            updatedBy: user?.email || user?.name || h.updatedBy,
            description: h.description,
            value // Be careful exposing this!
        };
    });

    return NextResponse.json({
        currentVersion: secret.version,
        history: formattedHistory
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Rollback
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; env: string; key: string }> }
) {
    try {
        const auth = await verifyAuth(req);
        if (!auth) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = auth.userId;
        const rawParams = await params;
        const { projectId, env } = rawParams;
        const keyArray = Array.isArray(rawParams.key) ? rawParams.key : [rawParams.key];
        const key = decodeURIComponent(keyArray.join('/'));
        const { version } = await req.json();

        if (!version) return NextResponse.json({ error: "Version required" }, { status: 400 });

        // Verify Project Access using RBAC
        const { getUserProjectRole } = await import("@/lib/permissions");
        const role = await getUserProjectRole(userId, projectId);
        if (!role) {
            return NextResponse.json({ error: "Forbidden: No access to this project" }, { status: 403 });
        }
        
        // Only allow developers, admins, and owners to rollback
        if (role === "viewer") {
            return NextResponse.json({ error: "Forbidden: Viewers cannot rollback secrets" }, { status: 403 });
        }
        
        if (role === "developer" && env === "production") {
            return NextResponse.json({ error: "Forbidden: Developers cannot rollback production secrets" }, { status: 403 });
        }
    
        const secret = await prisma.secret.findFirst({
            where: { projectId, environmentType: env, key }
        });
    
        if (!secret) return NextResponse.json({ error: "Secret not found" }, { status: 404 });

        if (secret.version === version) {
            return NextResponse.json({ error: "Already on this version" }, { status: 400 });
        }

        const history = Array.isArray(secret.history) ? secret.history as any[] : [];
        const targetVersion = history.find((h: any) => h.version === version);

        if (!targetVersion) {
            return NextResponse.json({ error: "Version not found in history" }, { status: 404 });
        }

        // Create new version entry for the rollback
        let newVersion = "1";
        if (secret.version && !isNaN(parseInt(secret.version))) {
             newVersion = (parseInt(secret.version) + 1).toString();
        }

        // Encrypt the target value for the main storage
        let encryptedValueToStore: string[] = [];
        try {
            // targetVersion.value might be plain text or an encrypted array already
            if (Array.isArray(targetVersion.value)) {
                encryptedValueToStore = targetVersion.value;
            } else if (typeof targetVersion.value === 'string') {
                try {
                    const parsed = JSON.parse(targetVersion.value);
                    if (parsed.iv && parsed.encryptedData) {
                        encryptedValueToStore = [targetVersion.value];
                    } else {
                        const encryptedValue = encrypt(targetVersion.value);
                        encryptedValueToStore = [JSON.stringify(encryptedValue)];
                    }
                } catch(e) {
                    const encryptedValue = encrypt(targetVersion.value);
                    encryptedValueToStore = [JSON.stringify(encryptedValue)];
                }
            }
        } catch (e) {
            return NextResponse.json({ error: "Failed to process target version value" }, { status: 500 });
        }

        const historyEntry = {
            version: newVersion,
            value: encryptedValueToStore,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
            description: `Rolled back to version ${version}`
        };

        const updated = await prisma.secret.update({
            where: { id: secret.id },
            data: {
                value: encryptedValueToStore, // Array of JSON string (encrypted)
                version: newVersion,
                updatedBy: userId,
                history: [historyEntry, ...history]
            }
        });

        // Trigger Webhook
        try {
            triggerWebhooks(projectId, "secret.rollback", {
                key,
                environment: env,
                fromVersion: secret.version,
                toVersion: newVersion,
                targetOriginalVersion: version,
                updatedBy: userId
            });
        } catch(e) { /* ignore webhook error */ }

        return NextResponse.json({ success: true, version: newVersion });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
