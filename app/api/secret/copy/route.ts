import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/util/db";
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
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

        // Verify Target Branch exists and user has access (checking via associated project)
        const targetBranch = await prisma.branch.findUnique({
            where: { id: targetBranchId },
            include: { project: { include: { ProjectMembership: true } } },
        });

        if (!targetBranch) {
            return NextResponse.json({ error: "Target branch not found" }, { status: 404 });
        }

        const isMember = targetBranch.project.ProjectMembership.some(
            (m: any) => m.userId === session.user.id
        );

        if (!isMember) {
            return NextResponse.json({ error: "Access denied to target branch's project" }, { status: 403 });
        }

        const envDest = targetEnvironment && targetEnvironment !== "all" ? targetEnvironment : null;

        let successCount = 0;
        let skipCount = 0;

        // Fetch existing target secrets to check for conflicts
        const existingTargetSecrets = await prisma.secret.findMany({
            where: { branchId: targetBranchId },
            select: { key: true, environmentType: true, id: true, version: true }
        });

        // Insert or Update the secrets in a transaction
        await prisma.$transaction(async (tx: any) => {
            for (const secret of sourceSecrets) {
                const targetEnvForSecret = envDest || secret.environmentType;
                
                // Find if conflict exists (same key in same environment on target branch)
                const existing = existingTargetSecrets.find(
                    (s: any) => s.key === secret.key && s.environmentType === targetEnvForSecret
                );

                if (existing) {
                    if (overwrite) {
                        // Update existing secret
                        const previousRecord = await tx.secret.findUnique({ where: { id: existing.id }});
                        if(previousRecord) {
                           await tx.secretHistory.create({
                                data: {
                                    secretId: existing.id,
                                    version: existing.version,
                                    value: previousRecord.value,
                                    description: previousRecord.description || "",
                                    changedBy: session.user.id,
                                    changeReason: "Copied and overwritten from branch " + sourceBranchId,
                                }
                            });
                        }

                        // Encryption
                        let finalValue = secret.value;
                        const originalValue = secret.value;
                        if (originalValue && !originalValue.startsWith('enc_') && process.env.ENCRYPTION_KEY) {
                          try {
                            const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
                            const IV_LENGTH = 16;
                            const iv = crypto.randomBytes(IV_LENGTH);
                            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
                            let encrypted = cipher.update(originalValue, 'utf8', 'hex');
                            encrypted += cipher.final('hex');
                            finalValue = `enc_${iv.toString('hex')}:${encrypted}`;
                          } catch (e) {
                             // Fallback to plain if encryption fails
                          }
                        }

                        await tx.secret.update({
                            where: { id: existing.id },
                            data: {
                                value: finalValue,
                                description: secret.description,
                                type: secret.type,
                                version: { increment: 1 },
                                updatedBy: session.user.id,
                            }
                        });
                        successCount++;
                    } else {
                        // Skip
                        skipCount++;
                    }
                } else {
                    // Create new secret
                    // Ensure the value is encrypted before saving
                    let finalValue = secret.value;
                    const originalValue = secret.value; // The source secret value is already encrypted in DB if it was encrypted there. 
                    // Wait, source secret is from our DB, so it's already encrypted if it was stored that way! 
                    // We don't need to re-encrypt it unless we want a new IV, but reusing the encrypted string is safe and exact.

                    await tx.secret.create({
                        data: {
                            key: secret.key,
                            value: secret.value, // It's already encrypted in the source record
                            description: secret.description,
                            type: secret.type,
                            environmentType: targetEnvForSecret as any,
                            rotationPolicy: secret.rotationPolicy,
                            rotationType: secret.rotationType,
                            expiryDate: secret.expiryDate,
                            permission: secret.permission || [],
                            projectId: targetBranch.projectId,
                            branchId: targetBranchId,
                            updatedBy: session.user.id,
                            version: 1,
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
}
