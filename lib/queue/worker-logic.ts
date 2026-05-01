import { sendEmail } from "@/lib/email";
import { sendSlackNotification } from "@/lib/notifications/slack";
import { sendTeamsNotification } from "@/lib/notifications/teams";
import { sendWebhookNotification } from "@/lib/notifications/webhook";

export async function processNotificationJob(data: any) {
  const { channel, payload } = data;
  
  try {
    if (channel.type === "slack") {
      const webhookUrl = (channel.config as any)?.webhookUrl || (channel.config as any)?.slackChannel;
      if (webhookUrl) await sendSlackNotification(webhookUrl, payload);
    } else if (channel.type === "teams") {
      const webhookUrl = (channel.config as any)?.teamsWebhook || (channel.config as any)?.webhookUrl;
      if (webhookUrl) await sendTeamsNotification(webhookUrl, payload);
    } else if (channel.type === "webhook") {
      const webhookUrl = (channel.config as any)?.webhookUrl;
      if (webhookUrl) await sendWebhookNotification(webhookUrl, payload);
    } else if (channel.type === "email") {
      const emailAddress = (channel.config as any)?.email;
      if (emailAddress) {
        await sendEmail({
          to: emailAddress,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        });
      }
    }
  } catch (error) {
    console.error(`[Worker] Failed to process notification for ${channel.name}:`, error);
    throw error; // Throwing will trigger BullMQ retry
  }
}

export async function processWebhookJob(data: any) {
  const { url, body } = data;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Webhook failed with status ${res.status}`);
  }
}

import prisma from "@/lib/db";
import { decrypt } from "@/lib/encription";
import { syncToAWS } from "@/lib/integrations/providers/aws";
import { syncToVercel } from "@/lib/integrations/providers/vercel";

export async function processSyncJob(data: any) {
    const { secretId } = data;

    const secret = await prisma.secret.findUnique({
        where: { id: secretId },
        include: { syncs: true }
    });

    if (!secret || secret.syncs.length === 0) return;

    // Decrypt value
    const decryptedValue = decrypt({
        iv: secret.value[0],
        encryptedData: secret.value[1],
        authTag: secret.value[2]
    });

    for (const sync of secret.syncs) {
        if (sync.status !== "active") continue;

        try {
            let result;
            if (sync.provider === "aws") {
                result = await syncToAWS(sync.externalKey, decryptedValue, sync.config as any);
            } else if (sync.provider === "vercel") {
                // Vercel needs an access token, which might be in User integrations or sync config
                // For simplicity, we assume it's in sync config for now or fetch from User
                const config = sync.config as any;
                result = await syncToVercel(sync.externalKey, decryptedValue, config.accessToken, config);
            }

            if (result?.success) {
                await prisma.secretSync.update({
                    where: { id: sync.id },
                    data: { 
                        lastSyncAt: new Date(),
                        lastError: null,
                        externalId: result.externalId
                    }
                });
            }
        } catch (error: any) {
            console.error(`[SyncWorker] Failed to sync ${secret.key} to ${sync.provider}:`, error);
            await prisma.secretSync.update({
                where: { id: sync.id },
                data: { 
                    lastError: error.message,
                    status: "error"
                }
            });
        }
    }
}
