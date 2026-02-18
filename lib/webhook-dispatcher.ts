import prisma from "@/lib/db";

export type WebhookEvent =
  | "secret.created"
  | "secret.updated"
  | "secret.deleted"
  | "rotation.success"
  | "rotation.failed"
  | "member.added"
  | "member.removed";

interface WebhookPayload {
  event: WebhookEvent;
  projectName?: string;
  details: string;
  timestamp?: string;
  [key: string]: unknown;
}

function buildMessage(payload: WebhookPayload): object {
  const emoji: Record<WebhookEvent, string> = {
    "secret.created":   "🔑",
    "secret.updated":   "✏️",
    "secret.deleted":   "🗑️",
    "rotation.success": "✅",
    "rotation.failed":  "❌",
    "member.added":     "👤",
    "member.removed":   "👋",
  };

  const icon = emoji[payload.event] ?? "🔔";
  const project = payload.projectName ? ` [${payload.projectName}]` : "";
  const ts = payload.timestamp ?? new Date().toISOString();
  const text = `${icon} *XtraSecurity${project}* — \`${payload.event}\`\n${payload.details}\n_${ts}_`;

  // Slack uses { text }, Discord uses { content } — send both so it works for either
  return { text, content: text };
}

/**
 * Fire-and-forget: dispatches a webhook event to all active subscribers for a project.
 * Never throws — errors are logged only.
 */
export async function dispatchWebhookEvent(
  projectId: string,
  event: WebhookEvent,
  payload: Omit<WebhookPayload, "event">
) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        projectId,
        active: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) return;

    const body = JSON.stringify(buildMessage({ ...payload, event }));

    await Promise.allSettled(
      webhooks.map((wh) =>
        fetch(wh.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }).catch((err) =>
          console.error(`[webhook] Failed to POST to ${wh.url}:`, err)
        )
      )
    );
  } catch (err) {
    console.error("[webhook-dispatcher] Unexpected error:", err);
  }
}

/**
 * Sends a test ping to a single URL to verify it's reachable.
 */
export async function testWebhookUrl(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const body = JSON.stringify(buildMessage({
      event: "secret.created",
      details: "✅ This is a test message from XtraSecurity. Your webhook is configured correctly!",
      timestamp: new Date().toISOString(),
    }));
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    return { ok: res.ok, status: res.status };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
