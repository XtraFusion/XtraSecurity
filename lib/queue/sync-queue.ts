import { Queue } from "bullmq";
import { connection } from "./config";

export const syncQueue = connection ? new Queue("secret-sync", {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  },
}) : null;

export async function queueSecretSync(secretId: string, action: "update" | "delete" = "update") {
  try {
    if (syncQueue) {
      await syncQueue.add(`sync-${secretId}-${Date.now()}`, {
        secretId,
        action,
      });
      return;
    }
  } catch (err) {
    console.error('[Queue] Failed to add sync job to Redis:', err);
  }
  // Fallback to synchronous processing
  const { processSyncJob } = await import('./worker-logic');
  await processSyncJob({ secretId, action });
}
