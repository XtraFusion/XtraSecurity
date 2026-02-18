/**
 * Slack notification sender
 * Sends a formatted message to a Slack Incoming Webhook URL
 */

export interface SlackNotificationPayload {
  title: string;
  message: string;
  description?: string;
  type?: "info" | "success" | "warning" | "error";
  fields?: { label: string; value: string }[];
}

const TYPE_COLORS: Record<string, string> = {
  info: "#4A90D9",
  success: "#2ECC71",
  warning: "#F39C12",
  error: "#E74C3C",
};

const TYPE_EMOJIS: Record<string, string> = {
  info: ":information_source:",
  success: ":white_check_mark:",
  warning: ":warning:",
  error: ":x:",
};

export async function sendSlackNotification(
  webhookUrl: string,
  payload: SlackNotificationPayload
): Promise<{ ok: boolean; error?: string }> {
  const { title, message, description, type = "info", fields = [] } = payload;

  const color = TYPE_COLORS[type] ?? TYPE_COLORS.info;
  const emoji = TYPE_EMOJIS[type] ?? TYPE_EMOJIS.info;

  const body = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *${title}*`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: description ? `${message}\n_${description}_` : message,
        },
      },
      ...(fields.length > 0
        ? [
            {
              type: "section",
              fields: fields.map((f) => ({
                type: "mrkdwn",
                text: `*${f.label}*\n${f.value}`,
              })),
            },
          ]
        : []),
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `XtraSecurity • ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
          },
        ],
      },
    ],
    attachments: [
      {
        color,
        fallback: `${title}: ${message}`,
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Slack returned ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
