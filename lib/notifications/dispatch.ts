/**
 * Central notification dispatcher
 * After a Notification is created, call dispatchNotification() to fan out
 * to all active external channels (Slack, etc.) for that workspace.
 */

import { sendSlackNotification, SlackNotificationPayload } from "./slack";
import { sendTeamsNotification } from "./teams";
import { sendWebhookNotification } from "./webhook";

interface DispatchOptions {
  title: string;
  message: string;
  description?: string;
  type?: "info" | "success" | "warning" | "error";
  severity?: string;
  fields?: { label: string; value: string }[];
  /** Optional — if provided, only channels for this workspace are notified */
  workspaceId?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Fetch active notification channels from MongoDB and send to each one.
 * Uses $runCommandRaw to avoid stale Prisma client issues.
 */
export async function dispatchNotification(options: DispatchOptions): Promise<void> {
  try {
    const { default: prisma } = await import("@/lib/db");

    // Build filter — include channels matching workspaceId OR global
    const filter: any = { enabled: true };
    if (options.workspaceId) {
      filter.$or = [
        { workspaceId: options.workspaceId },
        { workspaceId: null },
        { workspaceId: { $exists: false } },
      ];
    } else {
      filter.workspaceId = { $in: [null, undefined] };
    }

    const result = await (prisma as any).$runCommandRaw({
      find: "NotificationChannel",
      filter,
    });

    const channels: any[] = result?.cursor?.firstBatch ?? [];

    if (channels.length === 0) return;

    // Common payload for non-Slack channels
    const commonPayload = {
      title: options.title,
      message: options.message,
      description: options.description,
      type: options.type ?? "info",
      severity: options.severity ?? "low",
      fields: options.fields,
      metadata: options.metadata,
      timestamp: new Date().toISOString(),
      platform: "XtraSecurity",
    };

    // Fan out to all active channels in parallel
    await Promise.allSettled(
      channels.map(async (channel) => {
        try {
          if (channel.type === "slack") {
            const webhookUrl = channel.config?.webhookUrl || channel.config?.slackChannel; // fallback for naming
            if (!webhookUrl) return;
            await sendSlackNotification(webhookUrl, {
              ...commonPayload,
            } as SlackNotificationPayload);
          } 
          
          else if (channel.type === "teams") {
            const webhookUrl = channel.config?.teamsWebhook || channel.config?.webhookUrl;
            if (!webhookUrl) return;
            await sendTeamsNotification(webhookUrl, {
              ...commonPayload,
            });
          }

          else if (channel.type === "webhook") {
            const webhookUrl = channel.config?.webhookUrl;
            if (!webhookUrl) return;
            await sendWebhookNotification(webhookUrl, {
              ...commonPayload,
            });
          }
          
          // Note: Email is handled separately in createNotification for now
          
    console.log(`[Dispatch] Success for channel "${channel.name}" (${channel.type})`);
        } catch (err) {
          console.error(`[Dispatch] Exception for channel "${channel.name}":`, err);
        }
      })
    );
  } catch (err) {
    // Never let dispatch errors crash the main request
    console.error("[Dispatch] Fatality in dispatchNotification:", err);
  }
}
