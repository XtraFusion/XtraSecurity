/**
 * Central notification dispatcher
 * After a Notification is created, call dispatchNotification() to fan out
 * to all active external channels (Slack, etc.) for that workspace.
 */

import { sendSlackNotification, SlackNotificationPayload } from "./slack";
import { sendTeamsNotification } from "./teams";
import { sendWebhookNotification } from "./webhook";
import { sendEmail } from "@/lib/email";

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
          
          else if (channel.type === "email") {
            const emailAddress = channel.config?.email;
            if (!emailAddress) return;
            const typeColor = options.type === "error" ? "#EF4444" : options.type === "warning" ? "#F59E0B" : "#6366F1";
            await sendEmail({
              to: emailAddress,
              subject: `[XtraSecurity] ${options.title}`,
              text: `${options.title}\n\n${options.message}${options.description ? `\n\n${options.description}` : ""}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                  <div style="background: ${typeColor}; padding: 12px 20px; border-radius: 6px 6px 0 0;">
                    <h2 style="color: #fff; margin: 0; font-size: 16px;">🔔 ${options.title}</h2>
                  </div>
                  <div style="padding: 20px; background: #f9fafb;">
                    <p style="color: #111827; font-size: 15px; margin-top: 0;">${options.message}</p>
                    ${options.description ? `<p style="color: #6b7280; font-size: 13px;">${options.description}</p>` : ""}
                    ${options.fields && options.fields.length > 0
                      ? `<table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px;">
                          ${options.fields.map(f => `
                            <tr>
                              <td style="padding: 6px 10px; background: #e5e7eb; font-weight: 600; width: 40%;">${f.label}</td>
                              <td style="padding: 6px 10px;">${f.value}</td>
                            </tr>
                          `).join("")}
                        </table>`
                      : ""}
                  </div>
                  <p style="font-size: 11px; color: #9ca3af; padding: 10px 20px 0;">
                    XtraSecurity • ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </p>
                </div>
              `,
            });
          }

          // eslint-disable-next-line no-console
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
