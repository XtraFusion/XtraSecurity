import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// GET /api/mfa/status - Get user's MFA status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { 
        mfaEnabled: true,
        mfaBackupCodes: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      mfaEnabled: user.mfaEnabled,
      backupCodesRemaining: user.mfaBackupCodes?.length || 0
    });

  } catch (error: any) {
    console.error("MFA status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
