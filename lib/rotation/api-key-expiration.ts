import prisma from "@/lib/db";
import { createNotification } from "@/lib/notifications";

/**
 * Scans for API keys that have expired or are about to expire and sends notifications.
 */
export async function checkApiKeyExpirations(lastCheckTime: Date) {
  const now = new Date();
  const warningWindowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
  const prevWarningWindowEnd = new Date(lastCheckTime.getTime() + 24 * 60 * 60 * 1000);

  try {
    // 1. Find keys that have expired since the last check
    const expiredKeys = await prisma.apiKey.findMany({
      where: {
        expiresAt: {
          gt: lastCheckTime,
          lte: now,
        },
        userId: { not: null }
      },
      include: { user: true }
    });

    for (const key of expiredKeys) {
      if (key.user && key.user.email) {
        await createNotification(
          key.user.id,
          key.user.email,
          "API Key Expired",
          `Your API key "${key.label}" has expired.`,
          `The API key starting with ${key.keyMask || "xs_..."} has reached its expiration date and is no longer valid for authentication. Please generate a new key if needed.`,
          "error",
          key.workspaceId
        );
      }
    }

    // 2. Find keys about to expire (entering the 24 hour warning window since last check)
    const upcomingExpirations = await prisma.apiKey.findMany({
      where: {
        expiresAt: {
          gt: prevWarningWindowEnd,
          lte: warningWindowEnd
        },
        userId: { not: null }
      },
      include: { user: true }
    });

    for (const key of upcomingExpirations) {
       if (key.user && key.user.email) {
        await createNotification(
          key.user.id,
          key.user.email,
          "API Key Expiring Soon",
          `Your API key "${key.label}" will expire in less than 24 hours.`,
          `The API key starting with ${key.keyMask || "xs_..."} is set to expire on ${key.expiresAt?.toLocaleString()}. Please ensure you rotate it to avoid service interruption.`,
          "warning",
          key.workspaceId
        );
      }
    }

  } catch (error) {
    console.error("[ExpirationCheck] Error scanning API keys:", error);
  }
}
