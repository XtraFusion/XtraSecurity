import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";
import { hashApiKey } from "@/lib/auth/service-account";
import { redis } from "@/lib/redis";

export interface AuthSession {
  userId: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  tier?: string;
  isServiceAccount?: boolean;
  serviceAccountId?: string;
  projectId?: string;
  permissions?: string[];
  apiKeyId?: string;
}

/**
 * Resolves the effective role for a user by checking both the legacy
 * User.role field and the RBAC UserRole table. If the user has an
 * admin or owner role in the RBAC table, they are treated as admin.
 */
async function resolveUserRole(userId: string, legacyRole?: string | null): Promise<string> {
  // If already admin/owner via legacy field, use it directly
  if (legacyRole === "admin" || legacyRole === "owner") {
    return legacyRole;
  }
  // Check RBAC UserRole table
  try {
    const adminUserRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: { name: { in: ["admin", "owner"] } }
      },
      include: { role: { select: { name: true } } }
    });
    if (adminUserRole) return adminUserRole.role.name;
  } catch (_) { /* Ignore DB errors, fall back to legacy */ }
  return legacyRole || "user";
}

export async function verifyAuth(req: NextRequest | Request): Promise<AuthSession | null> {
  // 1. Check API Key (Header: X-API-Key or Authorization: Bearer)
  let apiKey = req.headers.get("x-api-key");
  if (!apiKey && req.headers.get("authorization")?.startsWith("Bearer ")) {
      apiKey = req.headers.get("authorization")!.split(" ")[1];
  }

  if (apiKey) {
    const hash = hashApiKey(apiKey);
    const cacheKey = `auth:apikey:${hash}`;

    // A. Check Redis Cache
    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                const parsedSession = JSON.parse(cached) as AuthSession;
                return parsedSession;
            }
        } catch (err) {
            console.error("Redis Auth Cache Error:", err);
        }
    }
    
    let keyRecord = await prisma.apiKey.findUnique({
      where: { key: hash },
      include: { user: true, serviceAccount: true },
    });

    if (!keyRecord) {
      keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { user: true, serviceAccount: true },
      });
    }

    if (keyRecord) {
      if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
          return null;
      }

      // Background update (fire and forget) to avoid blocking API
      prisma.apiKey.update({ 
        where: { id: keyRecord.id }, 
        data: { lastUsed: new Date() } 
      }).catch(() => {});
      
      let sessionData: AuthSession | null = null;

      if (keyRecord.userId && keyRecord.user) {
        const resolvedRole = await resolveUserRole(keyRecord.user.id, keyRecord.user.role);
        
        sessionData = {
            userId: keyRecord.user.id,
            email: keyRecord.user.email,
            name: keyRecord.user.name,
            role: resolvedRole,
            tier: keyRecord.user.tier || 'free',
            apiKeyId: keyRecord.id
        };
      } else if (keyRecord.serviceAccountId && keyRecord.serviceAccount) {
          sessionData = {
              userId: `sa_${keyRecord.serviceAccount.id}`,
              email: `sa_${keyRecord.serviceAccount.name}@bot`,
              role: "service_account",
              tier: "enterprise",
              isServiceAccount: true,
              serviceAccountId: keyRecord.serviceAccount.id,
              projectId: keyRecord.serviceAccount.projectId,
              permissions: keyRecord.serviceAccount.permissions,
              apiKeyId: keyRecord.id
          };
      }

      if (sessionData) {
          
          if (redis) {
              // Cache for 5 minutes
              redis.set(cacheKey, JSON.stringify(sessionData), "EX", 300).catch(()=>{});
          }
          return sessionData;
      }

      return null;
    }

    // B. Try as CLI JWT (Stateless Verification)
    try {
        const secret = process.env.NEXTAUTH_SECRET || "fallback_secret";
        
        // 1. Try strict verification
        try {
            const decoded = jwt.verify(apiKey, secret) as any;
            if (decoded && decoded.type === "cli-token") {
                const userId = decoded.userId || decoded.id;
                return {
                    userId,
                    email: decoded.email,
                    name: decoded.name,
                    role: decoded.role,
                    tier: decoded.tier || 'free',
                    isServiceAccount: decoded.isServiceAccount,
                    serviceAccountId: decoded.serviceAccountId,
                    projectId: decoded.projectId,
                    permissions: decoded.permissions
                };
            }
        } catch (localVerifyErr) { /* fallback to decode below */ }

        // 2. Fallback: decode WITHOUT verification for cross-environment cli-tokens
        const decoded = jwt.decode(apiKey) as any;
        if (decoded && decoded.type === "cli-token") {
            if (decoded.isServiceAccount && decoded.serviceAccountId) {
                const sa = await prisma.serviceAccount.findUnique({
                    where: { id: decoded.serviceAccountId }
                });
                if (sa) {
                    return {
                        userId: decoded.userId || `sa_${sa.id}`,
                        email: decoded.email || `sa_${sa.name}@bot`,
                        name: sa.name,
                        role: "service_account",
                        tier: "enterprise",
                        isServiceAccount: true,
                        serviceAccountId: sa.id,
                        projectId: sa.projectId,
                        permissions: sa.permissions
                    };
                }
            } else if (decoded.id || decoded.email) {
                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            decoded.id ? { id: decoded.id } : undefined,
                            decoded.email ? { email: decoded.email } : undefined,
                        ].filter(Boolean) as any,
                    },
                    select: { id: true, email: true, name: true, role: true, tier: true }
                });

                if (user) {
                    const resolvedRole = await resolveUserRole(user.id, user.role);
                    return {
                        userId: user.id,
                        email: user.email,
                        name: user.name,
                        role: resolvedRole,
                        tier: user.tier || 'free'
                    };
                }
            }
        }
    } catch (e) { /* ignore */ }
    return null;
  }

  // 2. Check Session Cookie (NextAuth)
  const session = await getServerSession(authOptions);
  if (session && session.user && session.user.id) {
    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as any).role || "user",
      tier: (session.user as any).tier || "free"
    };
  }

  return null;
}
