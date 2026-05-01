import { Queue } from 'bullmq';
import { connection } from './config';

export const WEBHOOK_QUEUE_NAME = 'webhook-queue';

export const webhookQueue = connection 
  ? new Queue(WEBHOOK_QUEUE_NAME, { 
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 10000, // 10s, 20s, 40s...
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    }) 
  : null;

export async function addWebhookJob(data: any) {
  if (webhookQueue) {
    try {
      await webhookQueue.add('dispatch-webhook', data);
    } catch (err) {
      console.error('[Queue] Failed to add webhook job to Redis:', err);
      const { processWebhookJob } = await import('./worker-logic');
      await processWebhookJob(data);
    }
  } else {
    // Fallback if Redis is not configured
    const { processWebhookJob } = await import('./worker-logic');
    await processWebhookJob(data);
  }
}
