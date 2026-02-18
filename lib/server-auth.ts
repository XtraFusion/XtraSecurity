import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";

import { hashApiKey } from "@/lib/auth/service-account";

export interface AuthSession {
  userId: string;
  email?: string | null;
  role?: string;
  tier?: string;
  isServiceAccount?: boolean;
  serviceAccountId?: string;
  projectId?: string;
  permissions?: string[];
}

export async function verifyAuth(req: NextRequest): Promise<AuthSession | null> {
  // 1. Check API Key (Header: X-API-Key or Authorization: Bearer)
  let apiKey = req.headers.get("x-api-key");
  if (!apiKey && req.headers.get("authorization")?.startsWith("Bearer ")) {
      apiKey = req.headers.get("authorization")!.split(" ")[1];
  }

  if (apiKey) {
    // Try to find as Service Account or User API Key
    const hash = hashApiKey(apiKey);
    
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: hash },
      include: { user: true, serviceAccount: true },
    });

    if (keyRecord) {
      // Check expiration
      if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
          return null;
      }

      // Update usage
      await prisma.apiKey.update({ 
        where: { id: keyRecord.id }, 
        data: { lastUsed: new Date() } 
      });
      
      if (keyRecord.serviceAccount) {
          return {
              userId: `sa_${keyRecord.serviceAccount.id}`,
              email: `sa_${keyRecord.serviceAccount.name}@bot`,
              role: "service_account",
              tier: "enterprise",
              isServiceAccount: true,
              serviceAccountId: keyRecord.serviceAccount.id,
              projectId: keyRecord.serviceAccount.projectId,
              permissions: keyRecord.serviceAccount.permissions
          };
      }

      if (keyRecord.user) {
        return {
            userId: keyRecord.user.id,
            email: keyRecord.user.email,
            role: keyRecord.user.role,
            tier: keyRecord.user.tier || 'free'
        };
      }
    }

    // B. Try as CLI JWT (Stateless Verification)
    try {
        const secret = process.env.NEXTAUTH_SECRET || "fallback_secret";
        const decoded = jwt.verify(apiKey, secret) as any;
        
        if (decoded && decoded.type === "cli-token") {
            return {
                userId: decoded.id,
                email: decoded.email,
                role: decoded.role,
                tier: decoded.tier || 'free'
            };
        }
    } catch (e) {
        // Not a valid JWT, or verification failed.
    }
  }

  // 2. Check Session Cookie (NextAuth)
  const session = await getServerSession(authOptions);
  if (session && session.user && session.user.id) {
    return {
      userId: session.user.id,
      email: session.user.email,
      role: (session.user as any).role || "user",
      tier: (session.user as any).tier || "free"
    };
  }

  return null;
}
