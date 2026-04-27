import { sendSlackNotification } from "./slack";
import { sendDiscordNotification } from "./discord";

/**
 * Sends a unified notification across all connected channels (Slack, Discord, etc.)
 * @param userId - The ID of the user to notify
 * @param title - Notification title
 * @param message - Main message content
 * @param detail - Optional detail context (e.g. App ID, Environment)
 */
export async function notify(userId: string, title: string, message: string, detail?: string, workspaceId?: string | null) {
  // 1. Dispatch to traditional Slack/Discord (Legacy/User-level)
  const legacyNotifs = [
    sendSlackNotification(userId, title, message, detail),
    sendDiscordNotification(userId, title, message, detail)
  ];

  // 2. Dispatch to ALL configured workspace channels (Slack, Discord, multiple Emails, Webhooks)
  const { dispatchNotification } = await import("./notifications/dispatch");
  const channelNotif = dispatchNotification({
    title,
    message,
    description: detail,
    type: "info",
    workspaceId: workspaceId || null,
  });

  // Promise.allSettled avoids failure in one blocking the other
  await Promise.allSettled([...legacyNotifs, channelNotif]);
}
