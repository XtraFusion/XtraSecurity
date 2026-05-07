import prisma from "@/lib/db";

/**
 * Increments the daily API usage counter for a given user.
 * Uses atomic upsert with increment to ensure thread-safety.
 */
export async function incrementDailyUsage(userId: string) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Handle Service Account IDs (strip sa_ prefix for MongoDB ObjectId compatibility)
      const cleanUserId = userId.startsWith("sa_") ? userId.replace("sa_", "") : userId;
      
      await prisma.dailyUsage.upsert({
        where: { userId_date: { userId: cleanUserId, date: today } },
        update: { count: { increment: 1 } },
        create: { userId: cleanUserId, date: today, count: 1 },
      });
      return; // success
    } catch (error: any) {
      const isDeadlock = error?.code === "P2034";
      if (isDeadlock && attempt < MAX_RETRIES) {
        // Exponential back-off: 50 ms, 100 ms, …
        await new Promise(r => setTimeout(r, 50 * attempt));
        continue;
      }
      // Either not a deadlock, or we've exhausted retries — log and give up.
      console.error(
        `[UsageTracking] Failed to increment daily usage for user ${userId} (attempt ${attempt}/${MAX_RETRIES}):`,
        error
      );
    }
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
