import prisma from "./db";
import { decrypt } from "./encription";
import axios from "axios";

export async function sendSlackNotification(userId: string, title: string, message: string, detail?: string) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: "slack" } },
    });

    if (!integration?.accessToken || !integration.enabled) return;

    let webhookUrl: string;
    try {
      webhookUrl = decrypt(JSON.parse(integration.accessToken));
    } catch (e) {
      console.error("Failed to decrypt Slack webhook URL:", e);
      return;
    }

    const payload = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🔔 ${title}`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${message}*`
          }
        },
        ...(detail ? [
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `_${detail}_`
              }
            ]
          }
        ] : []),
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "Sent from *XtraSecurity Dashboard*"
            }
          ]
        }
      ]
    };

    await axios.post(webhookUrl, payload, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Slack Notification Error:", error);
  }
}
