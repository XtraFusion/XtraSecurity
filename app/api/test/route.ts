import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const secrets = await prisma.secret.findMany({
            where: { key: "KEY" }
        });
        const results = secrets.map(s => ({
            key: s.key,
            env: s.environmentType,
            version: s.version,
            historyIsArray: Array.isArray(s.history),
            historyLength: Array.isArray(s.history) ? s.history.length : null,
            history: s.history
        }));
        return NextResponse.json(results);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
