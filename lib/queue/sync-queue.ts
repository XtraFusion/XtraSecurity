import { Queue } from "bullmq";
import { connection } from "./config";

export const syncQueue = new Queue("secret-sync", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

export async function queueSecretSync(secretId: string, action: "update" | "delete" = "update") {
  try {
    await syncQueue.add(`sync-${secretId}-${Date.now()}`, {
      secretId,
      action,
    });
  } catch (err) {
    console.error('[Queue] Failed to add sync job to Redis:', err);
    // Fallback to synchronous processing
    const { processSyncJob } = await import('./worker-logic');
    await processSyncJob({ secretId, action });
  }
}
