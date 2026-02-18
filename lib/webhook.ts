import prisma from "@/lib/db";

interface WebhookPayload {
  event: string;
  projectId: string;
  data: any;
  timestamp?: string;
}

export async function triggerWebhooks(projectId: string, event: string, data: any) {
  try {
    // 1. Find active webhooks for this project that subscribe to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        projectId,
        active: true,
        events: { has: event }
      }
    });

    if (webhooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      projectId,
      timestamp: new Date().toISOString(),
      data
    };

    // 2. Fire requests in parallel (fire-and-forget style to not block main thread)
    // In a real prod env, this should use a message queue (Redis/Bull/Kafka)
    Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          const response = await fetch(webhook.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            // Set a timeout to avoid hanging
            signal: AbortSignal.timeout(5000) 
          });

          if (!response.ok) {
            console.warn(`Webhook ${webhook.id} failed with status ${response.status}`);
          }
        } catch (err) {
          console.error(`Webhook ${webhook.id} error:`, err);
        }
      })
    );

  } catch (error) {
    console.error("Error triggering webhooks:", error);
  }
}
