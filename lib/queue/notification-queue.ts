import { Queue } from 'bullmq';
import { connection } from './config';

export const NOTIFICATION_QUEUE_NAME = 'notification-queue';

export const notificationQueue = connection 
  ? new Queue(NOTIFICATION_QUEUE_NAME, { 
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, 10s, 20s...
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    }) 
  : null;

export async function addNotificationJob(data: any) {
  if (notificationQueue) {
    try {
      await notificationQueue.add('send-notification', data);
    } catch (err) {
      console.error('[Queue] Failed to add notification job to Redis:', err);
      // Fallback to synchronous processing if add fails
      const { processNotificationJob } = await import('./worker-logic');
      await processNotificationJob(data);
    }
  } else {
    // Fallback if Redis is not configured
    const { processNotificationJob } = await import('./worker-logic');
    await processNotificationJob(data);
  }
}
