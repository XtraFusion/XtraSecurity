import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { triggerWebhooks } from "@/lib/webhook";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = auth.userId;
    const { projectId } = await params;
    
    const { fromEnv: rawFromEnv, toEnv: rawToEnv, overwrite, branch: branchName = "main" } = await req.json();

    if (!rawFromEnv || !rawToEnv) {
      return NextResponse.json({ error: "Source and destination environments required" }, { status: 400 });
    }

    const fromEnv = rawFromEnv.toLowerCase();
    const toEnv = rawToEnv.toLowerCase();

    if (fromEnv === toEnv) {
        return NextResponse.json({ error: "Cannot clone to same environment" }, { status: 400 });
    }

    // Verify Project Access
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: auth.userId },
        include: { secrets: true }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Resolve Branch
    const branch = await prisma.branch.findFirst({
        where: { projectId, name: branchName }
    });

    console.log("DEBUG: Clone Request", { fromEnv, toEnv, branchName, branchId: branch.id });
    console.log("DEBUG: Total Project Secrets:", project.secrets.length);
    
    const sourceSecrets = project.secrets.filter(
        (s) => s.environmentType.toLowerCase() === fromEnv && s.branchId === branch.id
    );

    let copiedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const secret of sourceSecrets) {
        // Check if exists in destination
        const existing = await prisma.secret.findFirst({
            where: {
                projectId,
                environmentType: toEnv,
                key: secret.key,
                branchId: branch.id
            }
        });

        if (existing) {
            if (overwrite) {
                // Update
                let newVersion = "2";
                if (existing.version && !isNaN(parseInt(existing.version))) {
                     newVersion = (parseInt(existing.version) + 1).toString();
                }

                const historyEntry = {
                    version: newVersion,
                    value: secret.value, // Copy value from source
                    updatedAt: new Date().toISOString(),
                    updatedBy: userId,
                    description: `Cloned from ${fromEnv}`
                };

                await prisma.secret.update({
                    where: { id: existing.id },
                    data: {
                        value: secret.value,
                        version: newVersion,
                        updatedBy: userId,
                        history: [historyEntry, ...(existing.history as any[])]
                    }
                });
                updatedCount++;
            } else {
                skippedCount++;
            }
        } else {
            // Create
            await prisma.secret.create({
                data: {
                    key: secret.key,
                    value: secret.value,
                    environmentType: toEnv,
                    projectId,
                    branchId: branch.id,
                    type: secret.type,
                    description: `Cloned from ${fromEnv}`,
                    version: "1",
                    updatedBy: userId,
                    rotationPolicy: secret.rotationPolicy,
                    history: [
                        {
                            version: "1",
                            value: secret.value,
                            updatedAt: new Date().toISOString(),
                            updatedBy: userId,
                            description: `Cloned from ${fromEnv}`
                        }
                    ]
                }
            });
            copiedCount++;
        }
    }

    // Trigger Webhook
    triggerWebhooks(projectId, "environment.clone", {
        fromEnv,
        toEnv,
        copied: copiedCount,
        updated: updatedCount,
        skipped: skippedCount,
        updatedBy: userId
    });

    return NextResponse.json({ 
        success: true, 
        summary: { copied: copiedCount, updated: updatedCount, skipped: skippedCount } 
    });

  } catch (error: any) {
    console.error("CLONE ERROR:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
