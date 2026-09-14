import prisma from "@/lib/db";

export interface QuotaCheckResult {
  allowed: boolean;
  tier: string;
  currentCount: number;
  maxAllowed: number;
  error?: string;
}

const TIER_LIMITS: Record<string, { maxWorkspaces: number; maxProjects: number }> = {
  free: { maxWorkspaces: 3, maxProjects: 5 },
  pro: { maxWorkspaces: 20, maxProjects: 50 },
  enterprise: { maxWorkspaces: 1000, maxProjects: 10000 },
};

/**
 * Validates whether a user is permitted to create an additional Workspace under their current tier (N26).
 */
export async function checkWorkspaceCreationQuota(userId: string): Promise<QuotaCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });

  const tier = (user?.tier || "free").toLowerCase();
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  const currentCount = await prisma.workspace.count({
    where: { createdBy: userId },
  });

  if (currentCount >= limits.maxWorkspaces) {
    return {
      allowed: false,
      tier,
      currentCount,
      maxAllowed: limits.maxWorkspaces,
      error: `Resource quota exceeded: ${tier.toUpperCase()} tier allows up to ${limits.maxWorkspaces} workspaces. Upgrade to Pro for increased limits.`,
    };
  }

  return {
    allowed: true,
    tier,
    currentCount,
    maxAllowed: limits.maxWorkspaces,
  };
}

/**
 * Validates whether a user is permitted to create an additional Project under their current tier (N26).
 */
export async function checkProjectCreationQuota(userId: string, workspaceId?: string): Promise<QuotaCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });

  const tier = (user?.tier || "free").toLowerCase();
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  const currentCount = await prisma.project.count({
    where: {
      OR: [
        { userId },
        ...(workspaceId ? [{ workspaceId }] : []),
      ],
    },
  });

  if (currentCount >= limits.maxProjects) {
    return {
      allowed: false,
      tier,
      currentCount,
      maxAllowed: limits.maxProjects,
      error: `Resource quota exceeded: ${tier.toUpperCase()} tier allows up to ${limits.maxProjects} projects. Upgrade to Pro for increased limits.`,
    };
  }

  return {
    allowed: true,
    tier,
    currentCount,
    maxAllowed: limits.maxProjects,
  };
}
