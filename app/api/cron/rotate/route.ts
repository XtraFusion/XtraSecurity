import { NextRequest, NextResponse } from "next/server";
import { runAutomatedRotations } from "@/lib/rotation/automation";
import prisma from "@/lib/db";

/**
 * GET /api/cron/rotate
 * Triggered by Vercel Cron, GitHub Actions, or Lazy Trigger.
 * Protected by CRON_SECRET for security.
 */
export async function GET(req: NextRequest) {
  return handleRotation(req);
}

export async function POST(req: NextRequest) {
  return handleRotation(req);
}

async function handleRotation(req: NextRequest) {
  try {
    // 1. Authorization
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // In dev, we might allow it without secret if explicitly requested, 
    // but in production, we MUST check.
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[Cron] Unauthorized rotation attempt blocked.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Run the logic
    const result = await runAutomatedRotations();

    // 3. Update global state for "last_rotation_check" (used by Lazy Cron)
    try {
      await prisma.globalState.upsert({
        where: { key: "last_rotation_check" },
        update: { lastCheckedAt: new Date() },
        create: { key: "last_rotation_check", lastCheckedAt: new Date() }
      });
    } catch (e) {
      console.error("[Cron] Failed to update GlobalState check time", e);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Cron] Error in selection rotation route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
