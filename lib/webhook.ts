import prisma from "@/lib/db";

const EVENT_EMOJI: Record<string, string> = {
  "secret.created":   "🔑",
  "secret.updated":   "✏️",
  "secret.deleted":   "🗑️",
  "rotation.success": "✅",
  "rotation.failed":  "❌",
  "member.added":     "👤",
  "member.removed":   "👋",
};

function buildSlackDiscordMessage(event: string, projectId: string, data: any): object {
  const icon = EVENT_EMOJI[event] ?? "🔔";
  const projectName = data?.projectName ?? projectId;
  const detail = data?.key
    ? `Secret \`${data.key}\` in \`${data.environment ?? "?"}\` environment`
    : data?.message ?? JSON.stringify(data ?? {}).slice(0, 200);

  const text = `${icon} *XtraSecurity [${projectName}]* — \`${event}\`\n${detail}\n_${new Date().toISOString()}_`;

  // Both Slack and Discord accept { text } / { content } — send both
  return { text, content: text };
}

export async function triggerWebhooks(projectId: string, event: string, data: any) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        projectId,
        active: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) return;

    const body = JSON.stringify(buildSlackDiscordMessage(event, projectId, data));

    // Fire-and-forget — never blocks the main request
    Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          const response = await fetch(webhook.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            signal: AbortSignal.timeout(5000),
          });
          if (!response.ok) {
            console.warn(`[webhook] ${webhook.id} responded with ${response.status}`);
          }
        } catch (err) {
          console.error(`[webhook] ${webhook.id} error:`, err);
        }
      })
    );
  } catch (error) {
    console.error("[webhook] triggerWebhooks error:", error);
  }
}
