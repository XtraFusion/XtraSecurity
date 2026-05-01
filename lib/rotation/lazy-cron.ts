import prisma from "@/lib/db";
import { runAutomatedRotations } from "./automation";
import { checkApiKeyExpirations } from "./api-key-expiration";

// Throttling period in milliseconds (default: 15 minutes)
const ROTATION_CHECK_THROTTLE = 15 * 60 * 1000;

/**
 * Lazy Trigger for Rotation Check.
 * Checks the GlobalState to see when the last check occurred.
 * If the throttle period has passed, it runs the rotation scan.
 */
export async function triggerLazyRotation() {
  try {
    // 1. Fetch GlobalState check time
    const lastCheck = await prisma.globalState.findUnique({
      where: { key: "last_rotation_check" },
      select: { lastCheckedAt: true }
    });

    const now = new Date();
    const shouldCheck = !lastCheck || (now.getTime() - lastCheck.lastCheckedAt.getTime() > ROTATION_CHECK_THROTTLE);

    if (shouldCheck) {
      console.log(`[LazyCron] Triggering rotation scan (last check: ${lastCheck?.lastCheckedAt.toISOString() || "never"})`);
      
      // Update GlobalState check time BEFORE starting (prevents race conditions/duplicate execution)
      await prisma.globalState.upsert({
        where: { key: "last_rotation_check" },
        update: { lastCheckedAt: now },
        create: { key: "last_rotation_check", lastCheckedAt: now }
      });

      // Fire and Forget (don't block the request)
      // We don't await runAutomatedRotations() here to avoid impacting the user's page load.
      runAutomatedRotations()
        .then(result => {
           if (result.success && result.processed > 0) {
              console.log(`[LazyCron] Successfully processed ${result.success} rotations.`);
           } else if (!result.success) {
              console.error("[LazyCron] Background rotation task failed:", result.error);
           }
        })
        .catch(err => {
           console.error("[LazyCron] Exception in background rotation task:", err);
        });

      // Also check API key expirations
      checkApiKeyExpirations()
        .catch(err => console.error("[LazyCron] API Key expiration check failed:", err));
    }
  } catch (error) {
    // Never let lazy cron crash the main UI
    console.error(`[LazyCron] Error in selection triggerLazyRotation:`, error);
  }
}
