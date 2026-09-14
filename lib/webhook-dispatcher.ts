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
  details?: string;
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

import crypto from "crypto";

/**
 * Sign outgoing webhook payloads using HMAC-SHA256 (N25).
 * Generates an immutable cryptographic signature formatted as: t=<timestamp>,v1=<hex>
 */
export function signWebhookPayload(payload: string, secret?: string): { signature: string; timestamp: string } {
  const timestamp = new Date().toISOString();
  const signingKey = secret || process.env.ENCRYPTION_KEY || "xtra-webhook-signing-key";
  const hmac = crypto.createHmac("sha256", signingKey);
  hmac.update(`${timestamp}.${payload}`);
  const signature = `t=${timestamp},v1=${hmac.digest("hex")}`;
  return { signature, timestamp };
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

    const { addWebhookJob } = await import("@/lib/queue/webhook-queue");
    const body = buildMessage({ ...payload, event });
    const payloadString = JSON.stringify(body);

    await Promise.allSettled(
      webhooks.map((wh) => {
        const { signature, timestamp } = signWebhookPayload(payloadString, (wh as any).secret);
        return addWebhookJob({
          url: wh.url,
          body,
          headers: {
            "X-Xtra-Signature": signature,
            "X-Xtra-Timestamp": timestamp,
            "X-Xtra-Event": event,
          },
        }).catch((err) =>
          console.error(`[webhook] Failed to queue webhook for ${wh.url}:`, err)
        );
      })
    );
  } catch (err) {
    console.error("[webhook-dispatcher] Unexpected error:", err);
  }
}

/**
 * Sends a test ping to a single URL to verify it's reachable.
 */
export async function testWebhookUrl(url: string, secret?: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const bodyObj = buildMessage({
      event: "secret.created",
      details: "✅ This is a test message from XtraSecurity. Your webhook is configured correctly!",
      timestamp: new Date().toISOString(),
    });
    const body = JSON.stringify(bodyObj);
    const { signature, timestamp } = signWebhookPayload(body, secret);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Xtra-Signature": signature,
        "X-Xtra-Timestamp": timestamp,
        "X-Xtra-Event": "secret.created",
      },
      body,
    });
    return { ok: res.ok, status: res.status };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

