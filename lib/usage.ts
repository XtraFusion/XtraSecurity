import prisma from "@/lib/db";

/**
 * Increments the daily API usage counter for a given user.
 * Uses atomic upsert with increment to ensure thread-safety.
 */
export async function incrementDailyUsage(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    await prisma.dailyUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        userId,
        date: today,
        count: 1,
      },
    });
  } catch (error) {
    // Fail silently to not block the main request, but log it.
    console.error(`[UsageTracking] Failed to increment daily usage for user ${userId}:`, error);
  }
}

/**
 * Fetches the daily API usage count for a given user.
 */
export async function getDailyUsageCount(userId: string): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await prisma.dailyUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });
    return record?.count || 0;
  } catch (error) {
    console.error(`[UsageTracking] Failed to fetch daily usage count for user ${userId}:`, error);
    return 0;
  }
}
