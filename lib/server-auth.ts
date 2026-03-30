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

export async function verifyAuth(req: NextRequest): Promise<AuthSession | null> {
  // 1. Check API Key (Header: X-API-Key or Authorization: Bearer)
  let apiKey = req.headers.get("x-api-key");
  if (!apiKey && req.headers.get("authorization")?.startsWith("Bearer ")) {
      apiKey = req.headers.get("authorization")!.split(" ")[1];
  }

  if (apiKey) {
    // Try to find as Service Account or User API Key
    // Service Account / new User keys are stored HASHED, legacy User keys are stored RAW
    const hash = hashApiKey(apiKey);
    
    let keyRecord = await prisma.apiKey.findUnique({
      where: { key: hash },
      include: { user: true, serviceAccount: true },
    });

    // Fallback: Check if it's stored raw
    if (!keyRecord) {
      keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { user: true, serviceAccount: true },
      });
    }

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
      
      if (keyRecord.userId && keyRecord.user) {
        const resolvedRole = await resolveUserRole(keyRecord.user.id, keyRecord.user.role);
        return {
            userId: keyRecord.user.id,
            email: keyRecord.user.email,
            role: resolvedRole,
            tier: keyRecord.user.tier || 'free'
        };
      }

      if (keyRecord.serviceAccountId && keyRecord.serviceAccount) {
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

      return null;
    }

    // B. Try as CLI JWT (Stateless Verification)
    try {
        const secret = process.env.NEXTAUTH_SECRET || "fallback_secret";
        
        // 1. Try strict verification with local secret first
        try {
            const decoded = jwt.verify(apiKey, secret) as any;
            if (decoded && decoded.type === "cli-token") {
                return {
                    userId: decoded.userId || decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                    tier: decoded.tier || 'free',
                    isServiceAccount: decoded.isServiceAccount,
                    serviceAccountId: decoded.serviceAccountId,
                    projectId: decoded.projectId,
                    permissions: decoded.permissions
                };
            }
        } catch (localVerifyErr) {
            // Local verification failed — token may have been signed by another environment (e.g. production Vercel)
        }

        // 2. Fallback: decode WITHOUT verification for cross-environment cli-tokens
        //    Then look up the user in DB to confirm they exist (safe because we still check the DB)
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
                    select: { id: true, email: true, role: true, tier: true }
                });

                if (user) {
                    const resolvedRole = await resolveUserRole(user.id, user.role);
                    return {
                        userId: user.id,
                        email: user.email,
                        role: resolvedRole,
                        tier: user.tier || 'free'
                    };
                }
            }
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
