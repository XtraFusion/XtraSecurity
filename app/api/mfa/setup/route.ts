import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { generateMfaSecret, generateQrCode, generateBackupCodes, hashBackupCode, verifyTotp } from "@/lib/mfa";
import { encrypt } from "@/lib/encription";

// POST /api/mfa/setup - Generate MFA secret and QR code
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, mfaEnabled: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.mfaEnabled) {
      return NextResponse.json({ error: "MFA is already enabled" }, { status: 400 });
    }

    // Generate new secret
    const secret = await generateMfaSecret();

    // Generate QR code
    const qrCode = await generateQrCode(user.email || "user", secret);

    // Store secret temporarily (not enabled yet)
    const encryptedSecret = encrypt(secret);
    await prisma.user.update({
      where: { id: auth.userId },
      data: { 
        mfaSecret: JSON.stringify(encryptedSecret)
      }
    });

    return NextResponse.json({
      qrCode,
      secret, // Show secret for manual entry
      message: "Scan QR code with your authenticator app, then verify with a code"
    });

  } catch (error: any) {
    console.error("MFA setup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/mfa/setup - Verify and enable MFA
export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token || token.length !== 6) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { mfaSecret: true, mfaEnabled: true }
    });

    if (!user || !user.mfaSecret) {
      return NextResponse.json({ error: "MFA setup not started" }, { status: 400 });
    }

    if (user.mfaEnabled) {
      return NextResponse.json({ error: "MFA is already enabled" }, { status: 400 });
    }

    // Decrypt and verify
    const { decrypt } = await import("@/lib/encription");
    const encryptedSecret = JSON.parse(user.mfaSecret);
    const secret = decrypt(encryptedSecret);

    if (!(await verifyTotp(token, secret))) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const hashedCodes = backupCodes.map(hashBackupCode);

    // Enable MFA
    await prisma.user.update({
      where: { id: auth.userId },
      data: {
        mfaEnabled: true,
        mfaBackupCodes: hashedCodes
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: "mfa_enabled",
        entity: "user",
        entityId: auth.userId,
        changes: {}
      }
    });

    return NextResponse.json({
      success: true,
      message: "MFA enabled successfully",
      backupCodes // Show once, user must save these
    });

  } catch (error: any) {
    console.error("MFA enable error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/mfa/setup - Disable MFA (requires current TOTP)
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { mfaSecret: true, mfaEnabled: true }
    });

    if (!user || !user.mfaEnabled) {
      return NextResponse.json({ error: "MFA is not enabled" }, { status: 400 });
    }

    // Verify current TOTP
    const { decrypt } = await import("@/lib/encription");
    const encryptedSecret = JSON.parse(user.mfaSecret!);
    const secret = decrypt(encryptedSecret);

    if (!(await verifyTotp(token, secret))) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Disable MFA
    await prisma.user.update({
      where: { id: auth.userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: []
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: "mfa_disabled",
        entity: "user",
        entityId: auth.userId,
        changes: {}
      }
    });

    return NextResponse.json({
      success: true,
      message: "MFA disabled successfully"
    });

  } catch (error: any) {
    console.error("MFA disable error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
