import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withSecurity } from "@/lib/api-middleware";
import { encrypt } from "@/lib/encription";

export const dynamic = 'force-dynamic';

export const POST = withSecurity(async (req: NextRequest, context: any, session: any) => {
    try {
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { sourceBranchId, targetBranchId, sourceEnvironment, targetEnvironment, overwrite } = body;

        if (!sourceBranchId || !targetBranchId) {
            return NextResponse.json({ error: "Source and Target Branch IDs are required" }, { status: 400 });
        }

        // Fetch source secrets
        let sourceQuery: any = { branchId: sourceBranchId };
        if (sourceEnvironment && sourceEnvironment !== "all") {
            sourceQuery.environmentType = sourceEnvironment;
        }

        const sourceSecrets = await prisma.secret.findMany({
            where: sourceQuery,
        });

        if (sourceSecrets.length === 0) {
            return NextResponse.json({ message: "No secrets found to copy", count: 0 }, { status: 200 });
        }

        // Verify Target Branch exists and user has access
        const targetBranch = await prisma.branch.findUnique({
            where: { id: targetBranchId },
        });

        if (!targetBranch) {
            return NextResponse.json({ error: "Target branch not found" }, { status: 404 });
        }

        // RBAC Write Check — only owner, admin, developer can write secrets
        const WRITE_ROLES = ["owner", "admin", "developer"];

        const callerRole = await prisma.userRole.findFirst({
            where: {
              userId: session.userId,
              OR: [{ projectId: targetBranch.projectId }, { projectId: null }]
            },
            select: { role: { select: { name: true } } }
        });

        const roleName = callerRole?.role?.name?.toLowerCase() || "viewer";

        if (!WRITE_ROLES.includes(roleName)) {
            return NextResponse.json(
                { error: "Forbidden: Your role does not permit writing secrets to this project." },
                { status: 403 }
            );
        }

        const envDest = targetEnvironment && targetEnvironment !== "all" ? targetEnvironment : null;

        let successCount = 0;
        let skipCount = 0;

        // Fetch existing target secrets to check for conflicts
        const existingTargetSecrets = await prisma.secret.findMany({
            where: { branchId: targetBranchId },
            select: { key: true, environmentType: true, id: true, version: true, history: true }
        });

        // Insert or Update the secrets in a transaction
        await prisma.$transaction(async (tx: any) => {
            for (const secret of sourceSecrets) {
                const targetEnvForSecret = envDest || secret.environmentType;
                
                // Find if conflict exists (same key in same environment on target branch)
                const existing = existingTargetSecrets.find(
                    (s: any) => s.key === secret.key && s.environmentType === targetEnvForSecret
                );

                const encryptedValueObj = encrypt(secret.value[0] || "");
                const encryptedString = JSON.stringify(encryptedValueObj);

                if (existing) {
                    if (overwrite) {
                        // Update existing secret
                        let newVersion = "2";
                        if (existing.version && !isNaN(parseInt(existing.version))) {
                            newVersion = (parseInt(existing.version) + 1).toString();
                        }

                        const historyEntry = {
                            version: newVersion,
                            value: [encryptedString],
                            updatedAt: new Date().toISOString(),
                            updatedBy: session.userId,
                            description: "Copied and overwritten from branch " + sourceBranchId,
                        };

                        const currentHistory = Array.isArray(existing.history) ? existing.history : [];

                        await tx.secret.update({
                            where: { id: existing.id },
                            data: {
                                value: [encryptedString],
                                description: secret.description,
                                type: secret.type,
                                version: newVersion,
                                updatedBy: session.userId,
                                history: [...currentHistory, historyEntry]
                            }
                        });
                        successCount++;
                    } else {
                        // Skip
                        skipCount++;
                    }
                } else {
                    // Create new secret
                    await tx.secret.create({
                        data: {
                            key: secret.key,
                            value: [encryptedString],
                            description: secret.description,
                            type: secret.type,
                            environmentType: targetEnvForSecret as any,
                            rotationPolicy: secret.rotationPolicy,
                            projectId: targetBranch.projectId,
                            branchId: targetBranchId,
                            updatedBy: session.userId,
                            version: "1",
                            history: [
                                {
                                    version: "1",
                                    value: [encryptedString],
                                    updatedAt: new Date().toISOString(),
                                    updatedBy: session.userId,
                                    description: "Copied from branch " + sourceBranchId,
                                }
                            ]
                        }
                    });
                    successCount++;
                }
            }
        });

        return NextResponse.json({ 
            message: `Successfully copied ${successCount} secrets.${skipCount > 0 ? ` Skipped ${skipCount} existing keys.` : ''}`,
            successCount, 
            skipCount 
        });

    } catch (error: any) {
        console.error("Copy secrets error:", error);
        return NextResponse.json({ error: error.message || "Failed to copy secrets" }, { status: 500 });
    }
});
