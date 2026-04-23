import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcrypt";
import { createTamperEvidentLog } from "@/lib/audit";
import { validateApiKey, hashApiKey } from "@/lib/auth/service-account";
// import { sign } from "jsonwebtoken"; // If separate JWT needed, but for now we might simple return a session token or basic mimic

const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-me";

export async function POST(req: NextRequest) {
  try {
    const { email, password, apiKey } = await req.json();

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

      // Update last used
      await prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsed: new Date() },
      });

      // Return a signed JWT acting as the session token
      const jwt = await import("jsonwebtoken");
      const secret = process.env.NEXTAUTH_SECRET || "fallback_secret";
      
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
      if (keyRecord.userId && keyRecord.user?.id) {
        createTamperEvidentLog({
          userId: keyRecord.user.id,
          action: "user.login_cli",
          entity: "apiKey",
          entityId: keyRecord.id,
          workspaceId: (keyRecord.user as any)?.workspaces?.[0]?.id || undefined,
          changes: { method: "api_key" }
        }).catch(err => console.error("Login audit failed:", err));
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

      // Check admin hardcoded bypass (legacy)
      if (email === "admin@example.com" && password === "password") {
          // Success
      } else {
          // Verify hash
          if (!user.password) {
             return NextResponse.json({ error: "Password not set for this user" }, { status: 400 });
          }
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
          }
      }

      // Issue true JWT instead of base64 placeholder
      const jwt = await import("jsonwebtoken");
      const secret = process.env.NEXTAUTH_SECRET || "fallback_secret";
      
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
      createTamperEvidentLog({
        userId: user.id,
        action: "user.login_cli",
        entity: "user",
        entityId: user.id,
        // For email login, we'd need to fetch their default workspace if we want to log it to a specific WS
        // but user.login is often global. If we have a workspace in user record, use it.
        workspaceId: (user as any).workspaces?.[0]?.id || undefined, 
        changes: { method: "email" }
      }).catch(err => console.error("Login audit failed:", err));

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
