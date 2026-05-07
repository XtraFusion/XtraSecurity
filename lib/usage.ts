import prisma from "@/lib/db";

/**
 * Increments the daily API usage counter for a given user.
 * @deprecated Daily usage is now automatically tracked via SecurityEvent records in the middleware.
 * This function is kept for backward compatibility but performs no operations.
 */
export async function incrementDailyUsage(_userId: string) {
  // No-op: Usage is now tracked via SecurityEvent creation in middleware
  return;
}

/**
 * Fetches the daily API usage count for a given user.
 * Aggregates security events for the current calendar day.
 */
export async function getDailyUsageCount(userId: string): Promise<number> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Handle Service Account IDs (strip sa_ prefix for MongoDB ObjectId compatibility)
    const cleanUserId = userId.startsWith("sa_") ? userId.replace("sa_", "") : userId;

    const count = await prisma.securityEvent.count({
      where: {
        userId: cleanUserId,
        timestamp: {
          gte: todayStart
        }
      }
    });

    return count;
  } catch (error) {
    console.error(`[UsageTracking] Failed to fetch daily usage count for user ${userId}:`, error);
    return 0;
  }
}
