import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcrypt";
// import { sign } from "jsonwebtoken"; // If separate JWT needed, but for now we might simple return a session token or basic mimic

const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-me";

export async function POST(req: NextRequest) {
  try {
    const { email, password, apiKey } = await req.json();

    if (apiKey) {
      // 1. Verify API Key
      // Ideally hashing the key, but for MVP assuming direct match or verify hash if implemented
      const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { user: true },
      });

      if (!keyRecord) {
        return NextResponse.json({ error: "Invalid Access Key" }, { status: 401 });
      }

      // Update last used
      await prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsed: new Date() },
      });

      // Return a signed JWT acting as the session token
      const jwt = await import("jsonwebtoken");
      const secret = process.env.NEXTAUTH_SECRET || "fallback_secret";
      
      const payload = {
          id: keyRecord.user?.id || `sa_${keyRecord.id}`,
          email: keyRecord.user?.email || "service-account@bot",
          role: keyRecord.user?.role || "service_account",
          tier: keyRecord.user?.tier || "enterprise", // SA usually enterprise
          type: "cli-token",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60) // 14 days
      };

      const token = jwt.sign(payload, secret);

      return NextResponse.json({
        token: token, 
        user: { 
          email: keyRecord.user?.email || "service-account@bot", 
          id: keyRecord.user?.id || `sa_${keyRecord.id}`, 
          role: keyRecord.user?.role || "service_account" 
        }
      });
    }

    if (email && password) {
      // 2. Verify Email/Password
      const user = await prisma.user.findUnique({
        where: { email },
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
          exp: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60) // 14 days
      };

      const token = jwt.sign(payload, secret);

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
