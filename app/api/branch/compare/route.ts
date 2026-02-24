import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/util/db"; // XtraSecurity seems to use util/db instead of lib/prisma

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
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

        const baseMap = new Map();
        baseSecrets.forEach((s: any) => baseMap.set(`${s.environmentType}:${s.key}`, s));

        const compareMap = new Map();
        compareSecrets.forEach((s: any) => compareMap.set(`${s.environmentType}:${s.key}`, s));

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
            } else if (baseSecret.value !== compSecret.value) {
                // Modified
                diffs.modified.push({
                    key: compSecret.key,
                    environmentType: compSecret.environmentType,
                    baseValue: baseSecret.value,
                    compareValue: compSecret.value,
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
}
