/**
 * Microsoft Teams notification sender
 * Sends a formatted Adaptive Card to a Teams Incoming Webhook URL
 */

export interface TeamsNotificationPayload {
  title: string;
  message: string;
  description?: string;
  type?: "info" | "success" | "warning" | "error";
  fields?: { label: string; value: string }[];
}

const TYPE_COLORS: Record<string, string> = {
  info: "accent",
  success: "good",
  warning: "warning",
  error: "attention",
};

export async function sendTeamsNotification(
  webhookUrl: string,
  payload: TeamsNotificationPayload
): Promise<{ ok: boolean; error?: string }> {
  const { title, message, description, type = "info", fields = [] } = payload;

  const color = TYPE_COLORS[type] ?? TYPE_COLORS.info;

  // Adaptive Card 1.4 JSON
  const body = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: title,
              size: "Large",
              weight: "Bolder",
              color: color === "good" ? "Success" : color === "attention" ? "Attention" : color === "warning" ? "Warning" : "Accent",
            },
            {
              type: "TextBlock",
              text: message,
              wrap: true,
            },
            ...(description
              ? [
                  {
                    type: "TextBlock",
                    text: description,
                    isSubtle: true,
                    wrap: true,
                    size: "Small",
                  },
                ]
              : []),
            ...(fields.length > 0
              ? [
                  {
                    type: "FactSet",
                    facts: fields.map((f) => ({
                      title: f.label,
                      value: f.value,
                    })),
                  },
                ]
              : []),
            {
              type: "TextBlock",
              text: `XtraSecurity • ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
              size: "Small",
              isSubtle: true,
              horizontalAlignment: "Right",
            },
          ],
        },
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
      return { ok: false, error: `Teams returned ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
