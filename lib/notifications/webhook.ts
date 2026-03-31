/**
 * Generic JSON webhook notification sender
 * Sends a standard JSON payload to a user-defined URL
 */

export interface WebhookNotificationPayload {
  title: string;
  message: string;
  description?: string;
  type?: "info" | "success" | "warning" | "error";
  severity?: string;
  fields?: { label: string; value: string }[];
  metadata?: Record<string, any>;
  timestamp: string;
  platform: string;
}

export async function sendWebhookNotification(
  webhookUrl: string,
  payload: WebhookNotificationPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Webhook returned ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
