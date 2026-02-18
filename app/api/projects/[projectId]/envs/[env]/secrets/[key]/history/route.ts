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

    const { projectId, env, key } = await params;

    // Verify Project Access
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: auth.userId }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

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
    const userIds = Array.from(new Set(history.map((h: any) => h.updatedBy).filter(Boolean)));
    const users = await prisma.user.findMany({
        where: { id: { in: userIds as string[] } },
        select: { id: true, email: true, name: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    
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
        const { projectId, env, key } = await params;
        const { version } = await req.json();

        if (!version) return NextResponse.json({ error: "Version required" }, { status: 400 });

        const project = await prisma.project.findFirst({
            where: { id: projectId, userId: auth.userId }
        });
    
        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    
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

        const historyEntry = {
            version: newVersion,
            value: targetVersion.value, // Keep original encrypted value
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
            description: `Rolled back to version ${version}`
        };

        const updated = await prisma.secret.update({
            where: { id: secret.id },
            data: {
                value: targetVersion.value,
                version: newVersion,
                updatedBy: userId,
                history: [historyEntry, ...history]
            }
        });

        // Trigger Webhook
        triggerWebhooks(projectId, "secret.rollback", {
            key,
            environment: env,
            fromVersion: secret.version,
            toVersion: newVersion,
            targetOriginalVersion: version,
            updatedBy: userId
        });

        return NextResponse.json({ success: true, version: newVersion });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
