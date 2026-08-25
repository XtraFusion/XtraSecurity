import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/audit";
import { validateApiKey, hashApiKey } from "@/lib/auth/service-account";
// import { sign } from "jsonwebtoken"; // If separate JWT needed, but for now we might simple return a session token or basic mimic

const SECRET_KEY = process.env.NEXTAUTH_SECRET;

export async function POST(req: NextRequest) {
  try {
    const { email, password, apiKey, totpCode, backupCode } = await req.json();

    if (apiKey) {
      // Clean up the key first
      const cleanKey = apiKey.trim();

      // 1. Verify API Key - Service Account keys are stored HASHED, older User keys are stored RAW
      const hash = hashApiKey(cleanKey);
    
      let keyRecord = await prisma.apiKey.findUnique({
        where: { key: hash },
        include: { 
          user: {
            include: { workspaces: { take: 1, select: { id: true } } }
          },
          serviceAccount: true
        },
      });

      // Fallback: Check if it's a User API Key stored raw (legacy behavior)
      if (!keyRecord) {
        keyRecord = await prisma.apiKey.findUnique({
          where: { key: cleanKey },
          include: { 
            user: {
              include: { workspaces: { take: 1, select: { id: true } } }
            },
            serviceAccount: true
          },
        });
      }

      if (!keyRecord) {
        console.log("❌ No API key found for this input.");
        return NextResponse.json({ error: "Invalid Access Key" }, { status: 401 });
      }
      
      console.log("✅ API key found!");

      // Check for expiration
      if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
        console.log("❌ API key has expired.");
        return NextResponse.json({ error: "Access Key has expired" }, { status: 401 });
      }

      // Update last used
      await prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsed: new Date() },
      });

      // Return a signed JWT acting as the session token
      const jwt = await import("jsonwebtoken");
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
      
      // Build payload based on whether this is a user API key or service account API key
      let payload;
      if (keyRecord.userId && keyRecord.user) {
        // User API Key
        payload = {
          id: keyRecord.user.id,
          email: keyRecord.user.email,
          role: keyRecord.user.role || "user",
          tier: keyRecord.user.tier || "free",
          type: "cli-token",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours (Zero Trust Compliance)
        };
      } else if (keyRecord.serviceAccountId && keyRecord.serviceAccount) {
        // Service Account API Key
        payload = {
          userId: `sa_${keyRecord.serviceAccount.id}`,
          email: `sa_${keyRecord.serviceAccount.name}@bot`,
          role: "service_account",
          tier: "enterprise",
          isServiceAccount: true,
          serviceAccountId: keyRecord.serviceAccount.id,
          projectId: keyRecord.serviceAccount.projectId,
          permissions: keyRecord.serviceAccount.permissions,
          type: "cli-token",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours (Zero Trust Compliance)
        };
      } else {
          return NextResponse.json({ error: "Invalid Access Key: Identity not found" }, { status: 401 });
      }

      const token = jwt.sign(payload, secret);

      // Audit Log
      // NOTE: We only log for valid User records because AuditLog.userId requires an ObjectId.
      if (keyRecord && keyRecord.userId && keyRecord.user?.id) {
        await logAudit(
          "USER_LOGIN_CLI",
          keyRecord.user.id,
          keyRecord.id,
          { method: "api_key" },
          (keyRecord.user as any)?.workspaces?.[0]?.id || undefined
        );
      }

      return NextResponse.json({
        token: token, 
        user: keyRecord.userId && keyRecord.user
          ? { 
            email: keyRecord.user.email, 
            id: keyRecord.user.id, 
            role: keyRecord.user.role || "user" 
          }
          : { 
            email: `sa_${keyRecord.serviceAccount?.name}@bot`, 
            id: `sa_${keyRecord.serviceAccount?.id}`, 
            role: "service_account",
            isServiceAccount: true
          }
      });
    }

    if (email && password) {
      // 2. Verify Email/Password
      const user = await prisma.user.findUnique({
        where: { email },
        include: { workspaces: { take: 1, select: { id: true } } }
      });

      if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      // Verify password hash
      if (!user.password) {
         return NextResponse.json({ error: "Password not set for this user" }, { status: 400 });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      // Enforce MFA verification if enabled
      if (user.mfaEnabled) {
        if (!totpCode && !backupCode) {
          return NextResponse.json({ 
            error: "MFA_REQUIRED", 
            message: "Two-factor authentication is enabled on this account. Please provide 'totpCode' or 'backupCode'." 
          }, { status: 403 });
        }

        let mfaValid = false;

        if (backupCode && Array.isArray(user.mfaBackupCodes)) {
          const { verifyBackupCode } = await import("@/lib/mfa");
          const index = verifyBackupCode(backupCode, user.mfaBackupCodes);
          if (index !== -1) {
            const updatedCodes = [...user.mfaBackupCodes];
            updatedCodes.splice(index, 1);
            await prisma.user.update({
              where: { id: user.id },
              data: { mfaBackupCodes: updatedCodes }
            });
            mfaValid = true;
          }
        } else if (totpCode && user.mfaSecret) {
          try {
            const { decrypt } = await import("@/lib/encription");
            const { verifyTotp } = await import("@/lib/mfa");
            const encryptedSecret = JSON.parse(user.mfaSecret);
            const rawSecret = decrypt(encryptedSecret);
            mfaValid = await verifyTotp(totpCode, rawSecret);
          } catch (e) {
            console.error("MFA verification error:", e);
          }
        }

        if (!mfaValid) {
          return NextResponse.json({ error: "Invalid two-factor authentication code" }, { status: 401 });
        }
      }

      // Issue true JWT instead of base64 placeholder
      const jwt = await import("jsonwebtoken");
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
      
      const payload = {
          id: user.id,
          email: user.email,
          role: user.role,
          tier: user.tier || 'free',
          type: "cli-token",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours (Zero Trust Compliance)
      };

      const token = jwt.sign(payload, secret);

      // Audit Log
      await logAudit(
        "USER_LOGIN_CLI",
        user.id,
        user.id,
        { method: "email" },
        (user as any).workspaces?.[0]?.id || undefined
      );

      return NextResponse.json({
        token: token,
        user: { email: user.email, id: user.id, role: user.role }
      });
    }

    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  } catch (error: any) {
    console.error("CLI Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
