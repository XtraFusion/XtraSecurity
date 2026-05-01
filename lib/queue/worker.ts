import { Worker } from 'bullmq';
import { connection } from './config';
import { NOTIFICATION_QUEUE_NAME } from './notification-queue';
import { WEBHOOK_QUEUE_NAME } from './webhook-queue';
import { processNotificationJob, processWebhookJob, processSyncJob } from './worker-logic';

let notificationWorker: Worker | null = null;
let webhookWorker: Worker | null = null;

export function initWorkers() {
  if (!connection) return;

  if (!notificationWorker) {
    notificationWorker = new Worker(
      NOTIFICATION_QUEUE_NAME,
      async (job) => {
        if (job.name === 'send-notification') {
          await processNotificationJob(job.data);
        }
      },
      { connection }
    );

    notificationWorker.on('completed', (job) => {
      console.log(`[Worker] Notification job ${job.id} completed.`);
    });

    notificationWorker.on('failed', (job, err) => {
      console.error(`[Worker] Notification job ${job?.id} failed:`, err);
    });
  }

  if (!webhookWorker) {
    webhookWorker = new Worker(
      WEBHOOK_QUEUE_NAME,
      async (job) => {
        if (job.name === 'dispatch-webhook') {
          await processWebhookJob(job.data);
        }
      },
      { connection }
    );

    webhookWorker.on('completed', (job) => {
      console.log(`[Worker] Webhook job ${job.id} completed.`);
    });

    webhookWorker.on('failed', (job, err) => {
      console.error(`[Worker] Webhook job ${job?.id} failed:`, err);
    });
  }

  // 3. Sync Worker
  new Worker(
    "secret-sync",
    async (job) => {
        await processSyncJob(job.data);
    },
    { 
        connection,
        concurrency: 5 // Allow 5 syncs in parallel
    }
  ).on('completed', (job) => {
    console.log(`[Worker] Sync job ${job.id} completed.`);
  }).on('failed', (job, err) => {
    console.error(`[Worker] Sync job ${job?.id} failed:`, err);
  });
}
