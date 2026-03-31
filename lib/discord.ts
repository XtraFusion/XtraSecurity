import prisma from "./db";
import { decrypt } from "./encription";
import axios from "axios";

export async function sendDiscordNotification(userId: string, title: string, message: string, detail?: string) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: "discord" } },
    });

    if (!integration?.accessToken || !integration.enabled) return;

    let webhookUrl: string;
    try {
      webhookUrl = decrypt(JSON.parse(integration.accessToken));
    } catch (e) {
      console.error("Failed to decrypt Discord webhook URL:", e);
      return;
    }

    const payload = {
      embeds: [
        {
          title: `🔔 ${title}`,
          description: message,
          color: 5814783, // Discord Blurple
          fields: detail ? [
            {
              name: "Details",
              value: detail,
              inline: false
            }
          ] : [],
          footer: {
            text: "Sent from XtraSecurity Dashboard",
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    await axios.post(webhookUrl, payload, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Discord Notification Error:", error);
  }
}
