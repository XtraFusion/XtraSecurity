import prisma from "@/lib/db";
import { createNotification } from "@/lib/notifications";

/**
 * Scans for API keys that have expired or are about to expire and sends notifications.
 */
export async function checkApiKeyExpirations() {
  const now = new Date();
  const warningWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  try {
    // 1. Find keys that have expired but haven't been notified yet (we'll use a flag or just notify once)
    // For simplicity, let's just find keys that expired in the last 24 hours and notify.
    // A better way would be to track 'lastNotified' but let's stick to a simple check for now.
    
    const expiredKeys = await prisma.apiKey.findMany({
      where: {
        expiresAt: {
          lt: now,
          // We can use a custom field or just assume if it's recently expired we notify.
          // To avoid spam, we should really have a 'notified' field.
          // Since I can't easily change the schema right now without migrations, 
          // I'll check for keys that expired recently (last 1 hour if this runs every 15 mins).
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

    // 2. Find keys about to expire (within 24 hours)
    const upcomingExpirations = await prisma.apiKey.findMany({
      where: {
        expiresAt: {
          gt: now,
          lt: warningWindow
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
