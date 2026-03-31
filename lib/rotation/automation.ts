import prisma from "@/lib/db";
import { RotationService } from "@/lib/rotation-service";

/**
 * Scans all active rotation schedules and executes those that are past due.
 * This can be triggered by a Cron job or a "Lazy" middleware trigger.
 */
export async function runAutomatedRotations() {
  console.log(`[Automation] Starting automated rotation scan at ${new Date().toISOString()}`);
  
  try {
    // 1. Fetch all active schedules where nextRotation is past or present
    const dueSchedules = await prisma.rotationSchedule.findMany({
      where: {
        status: "active",
        nextRotation: {
          lte: new Date()
        }
      },
      include: {
        secret: true
      }
    });

    console.log(`[Automation] Found ${dueSchedules.length} schedules due for rotation.`);

    if (dueSchedules.length === 0) {
      return { success: true, processed: 0 };
    }

    const results = await Promise.allSettled(
      dueSchedules.map(async (schedule) => {
        try {
          console.log(`[Automation] Rotating secret "${schedule.secret.key}" (ID: ${schedule.secretId})...`);
          
          const result = await RotationService.rotateSecret(schedule.id, "system-automation");
          
          if (result.success) {
            console.log(`[Automation] Successfully rotated "${schedule.secret.key}".`);
          } else {
            console.error(`[Automation] Rotation logic returned failure for "${schedule.secret.key}".`);
          }
          
          return { id: schedule.id, key: schedule.secret.key, success: result.success };
        } catch (err: any) {
          console.error(`[Automation] Failed to rotate "${schedule.secret.key}":`, err.message);
          return { id: schedule.id, key: schedule.secret.key, success: false, error: err.message };
        }
      })
    );

    const summary = results.reduce(
      (acc: any, curr: any) => {
        if (curr.status === "fulfilled") {
          if (curr.value.success) acc.success++;
          else acc.failed++;
        } else {
          acc.failed++;
        }
        return acc;
      },
      { success: 0, failed: 0 }
    );

    console.log(`[Automation] Finished. Summary: ${summary.success} succeeded, ${summary.failed} failed.`);
    return { success: true, ...summary };

  } catch (error: any) {
    console.error("[Automation] Critical failure in automated rotation task:", error);
    return { success: false, error: error.message };
  }
}
