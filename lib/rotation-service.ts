import prisma from "@/lib/db";
import { randomBytes } from "crypto";

export class RotationService {
  /**
   * Generates a secure random string for the new secret value.
   */
  private static generateSecretValue(): string {
    return randomBytes(32).toString("hex");
  }

  /**
   * Performs the rotation for a specific schedule.
   * In a real app, this would call an external provider (AWS, etc.).
   * Here, we simulate it by updating the generic secret value.
   */
  static async rotateSecret(scheduleId: string, runBy: string = "system") {
    console.log(`Starting rotation for schedule: ${scheduleId}`);
    
    // 1. Fetch Schedule
    const schedule = await prisma.rotationSchedule.findUnique({
      where: { id: scheduleId },
      include: { secret: true }
    });

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    if (schedule.status === "paused") {
      throw new Error("Schedule is paused");
    }

    const startTime = new Date();
    let status = "success";
    let error = null;

    try {
      // 2. "Rotate" the secret (Simulation)
      // In a real scenario, we'd check `schedule.method` and call the appropriate provider.
      
      const newValue = this.generateSecretValue();
      const newVersion = (parseInt(schedule.secret.version) + 1).toString();

      // 3. Update the Secret in DB
      // We push the *current* value to history and set the *new* value
      const oldHistory = (schedule.secret.history as any[]) || [];
      const historyEntry = {
        version: schedule.secret.version,
        value: schedule.secret.value, // It's an array in schema, but usually we rotate the first/main one
        createdAt: schedule.secret.lastUpdated,
        rotatedBy: runBy // system or user email
      };

      await prisma.secret.update({
        where: { id: schedule.secretId },
        data: {
          value: [newValue], // Assuming single value replacement for simplicity
          version: newVersion,
          lastUpdated: new Date(),
          history: [...oldHistory, historyEntry],
        }
      });

      // 4. Trigger Webhook if configured
      if (schedule.method === "webhook" && schedule.webhookUrl) {
        try {
            // Fire and forget, or await if critical
            await fetch(schedule.webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "secret_rotated",
                    secretId: schedule.secret.id,
                    secretKey: schedule.secret.key,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (webhookErr: any) {
            console.error("Webhook failed", webhookErr);
            // We don't fail the rotation if webhook fails, but we could log it
        }
      }

      // 5. Update Schedule Metadata
      await prisma.rotationSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRotation: new Date(),
          // Calculate next rotation based on frequency (simplified)
          nextRotation: this.calculateNextRotation(schedule.frequency, schedule.customDays),
        }
      });

    } catch (err: any) {
      console.error("Rotation failed:", err);
      status = "failed";
      error = err.message || "Unknown error";
      throw err; // Re-throw to caller? Or just log?
    } finally {
      // 6. Create Audit Log
      await prisma.rotationLog.create({
        data: {
          scheduleId,
          status,
          startedAt: startTime,
          completedAt: new Date(),
          error
        }
      });
    }

    return { success: status === "success", newValue: "HIDDEN" };
  }

  private static calculateNextRotation(frequency: string, customDays?: number | null): Date {
    const next = new Date();
    switch (frequency) {
        case "daily": next.setDate(next.getDate() + 1); break;
        case "weekly": next.setDate(next.getDate() + 7); break;
        case "monthly": next.setMonth(next.getMonth() + 1); break;
        case "quarterly": next.setMonth(next.getMonth() + 3); break;
        case "custom": next.setDate(next.getDate() + (customDays || 30)); break;
        default: next.setMonth(next.getMonth() + 1);
    }
    return next;
  }
}
