import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withSecurity } from "@/lib/api-middleware";
import { decrypt } from "@/lib/encription";

export const dynamic = 'force-dynamic';

export const GET = withSecurity(async (req: NextRequest, context: any, session: any) => {
    try {
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const baseBranchId = searchParams.get("base");
        const compareBranchId = searchParams.get("compare");

        if (!baseBranchId || !compareBranchId) {
            return NextResponse.json({ error: "Base and Compare Branch IDs are required" }, { status: 400 });
        }

        // Fetch secrets for both branches
        const [baseSecrets, compareSecrets] = await Promise.all([
            prisma.secret.findMany({ where: { branchId: baseBranchId } }),
            prisma.secret.findMany({ where: { branchId: compareBranchId } })
        ]);

        const decryptSecretValue = (valArray: string[]) => {
            if (!valArray || valArray.length === 0) return "";
            const rawValue = valArray[0];
            try {
                const encryptedObj = JSON.parse(rawValue);
                if (encryptedObj.iv && encryptedObj.encryptedData && encryptedObj.authTag) {
                    return decrypt(encryptedObj);
                }
                return rawValue;
            } catch (e) {
                return rawValue;
            }
        };

        const baseMap = new Map();
        baseSecrets.forEach((s: any) => {
            const decValue = decryptSecretValue(s.value);
            baseMap.set(`${s.environmentType}:${s.key}`, { ...s, decryptedValue: decValue });
        });

        const compareMap = new Map();
        compareSecrets.forEach((s: any) => {
            const decValue = decryptSecretValue(s.value);
            compareMap.set(`${s.environmentType}:${s.key}`, { ...s, decryptedValue: decValue });
        });

        const diffs = {
            added: [] as any[],    // In compare, not in base
            removed: [] as any[],  // In base, not in compare
            modified: [] as any[]  // In both, differing values
        };

        // Check for Added and Modified
        for (const [keySig, compSecret] of compareMap.entries()) {
            const baseSecret = baseMap.get(keySig);
            
            if (!baseSecret) {
                diffs.added.push(compSecret);
            } else if (baseSecret.decryptedValue !== compSecret.decryptedValue) {
                // Modified
                diffs.modified.push({
                    key: compSecret.key,
                    environmentType: compSecret.environmentType,
                    baseValue: baseSecret.decryptedValue,
                    compareValue: compSecret.decryptedValue,
                    type: compSecret.type
                });
            }
        }

        // Check for Removed
        for (const [keySig, baseSecret] of baseMap.entries()) {
            if (!compareMap.has(keySig)) {
                diffs.removed.push(baseSecret);
            }
        }

        return NextResponse.json(diffs);

    } catch (error: any) {
        console.error("Compare branch error:", error);
        return NextResponse.json({ error: error.message || "Failed to compare branches" }, { status: 500 });
    }
});
