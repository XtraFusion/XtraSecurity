/**
 * Central notification dispatcher
 * After a Notification is created, call dispatchNotification() to fan out
 * to all active external channels (Slack, etc.) for that workspace.
 */

import { sendSlackNotification, SlackNotificationPayload } from "./slack";

interface DispatchOptions {
  title: string;
  message: string;
  description?: string;
  type?: "info" | "success" | "warning" | "error";
  fields?: { label: string; value: string }[];
  /** Optional — if provided, only channels for this workspace are notified */
  workspaceId?: string | null;
}

/**
 * Fetch active notification channels from MongoDB and send to each one.
 * Uses $runCommandRaw to avoid stale Prisma client issues.
 */
export async function dispatchNotification(options: DispatchOptions): Promise<void> {
  try {
    const { default: prisma } = await import("@/lib/db");

    // Build filter — include channels with no workspaceId (global) OR matching workspaceId
    const filter: any = { enabled: true, type: "slack" };
    if (options.workspaceId) {
      filter.$or = [
        { workspaceId: options.workspaceId },
        { workspaceId: null },
        { workspaceId: { $exists: false } },
      ];
    }

    const result = await (prisma as any).$runCommandRaw({
      find: "NotificationChannel",
      filter,
    });

    const channels: any[] = result?.cursor?.firstBatch ?? [];

    if (channels.length === 0) return;

    const payload: SlackNotificationPayload = {
      title: options.title,
      message: options.message,
      description: options.description,
      type: options.type ?? "info",
      fields: options.fields,
    };

    // Fan out to all active Slack channels in parallel
    await Promise.allSettled(
      channels.map(async (channel) => {
        const webhookUrl = channel.config?.webhookUrl;
        if (!webhookUrl) return;

        const result = await sendSlackNotification(webhookUrl, payload);
        if (!result.ok) {
          console.error(`[Slack] Failed to send to channel "${channel.name}":`, result.error);
        } else {
          console.log(`[Slack] Sent to channel "${channel.name}"`);
        }
      })
    );
  } catch (err) {
    // Never let dispatch errors crash the main request
    console.error("[Dispatch] Error dispatching notification:", err);
  }
}
