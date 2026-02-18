import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { verifyTotp, verifyBackupCode } from "@/lib/mfa";
import jwt from "jsonwebtoken";

const MFA_SESSION_EXPIRY = 15 * 60; // 15 minutes

// POST /api/mfa/verify - Verify TOTP for sensitive operations
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, useBackupCode } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { mfaSecret: true, mfaEnabled: true, mfaBackupCodes: true }
    });

    if (!user || !user.mfaEnabled) {
      return NextResponse.json({ error: "MFA is not enabled" }, { status: 400 });
    }

    let verified = false;

    if (useBackupCode) {
      // Verify backup code
      const index = verifyBackupCode(token, user.mfaBackupCodes);
      if (index !== -1) {
        // Remove used backup code
        const updatedCodes = [...user.mfaBackupCodes];
        updatedCodes.splice(index, 1);
        
        await prisma.user.update({
          where: { id: auth.userId },
          data: { mfaBackupCodes: updatedCodes }
        });
        
        verified = true;
      }
    } else {
      // Verify TOTP
      const { decrypt } = await import("@/lib/encription");
      const encryptedSecret = JSON.parse(user.mfaSecret!);
      const secret = decrypt(encryptedSecret);
      verified = verifyTotp(token, secret);
    }

    if (!verified) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Generate short-lived MFA session token
    const mfaToken = jwt.sign(
      {
        userId: auth.userId,
        mfaVerified: true,
        exp: Math.floor(Date.now() / 1000) + MFA_SESSION_EXPIRY
      },
      process.env.NEXTAUTH_SECRET!
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: "mfa_verified",
        entity: "user",
        entityId: auth.userId,
        changes: { method: useBackupCode ? "backup_code" : "totp" }
      }
    });

    return NextResponse.json({
      success: true,
      mfaToken,
      expiresIn: MFA_SESSION_EXPIRY,
      message: "MFA verified successfully"
    });

  } catch (error: any) {
    console.error("MFA verify error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/mfa/verify - Check MFA token validity
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mfaToken = req.headers.get("x-mfa-token");

    if (!mfaToken) {
      return NextResponse.json({ valid: false, reason: "No MFA token provided" });
    }

    try {
      const decoded = jwt.verify(mfaToken, process.env.NEXTAUTH_SECRET!) as any;
      
      if (decoded.userId !== auth.userId) {
        return NextResponse.json({ valid: false, reason: "Token user mismatch" });
      }

      return NextResponse.json({
        valid: true,
        mfaVerified: decoded.mfaVerified,
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      });
    } catch {
      return NextResponse.json({ valid: false, reason: "Invalid or expired token" });
    }

  } catch (error: any) {
    console.error("MFA check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
