import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/slack - Get status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "slack" } },
      select: { username: true, createdAt: true, enabled: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    
    return NextResponse.json({
      connected: true,
      username: integration.username,
      connectedAt: integration.createdAt,
      enabled: integration.enabled,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/slack - Connect/Update
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { webhookUrl } = await req.json();
    if (!webhookUrl) return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });

    try {
      // 1. Send test message to Slack
      await axios.post(webhookUrl, {
        text: "✅ *XtraSecurity Notification Linked Successfully!*",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "🚀 *XtraSecurity Notification Linked Successfully!*"
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "You will now receive notifications for secret syncs and security events."
              }
            ]
          }
        ]
      });

      // 2. Encrypt and store the webhook URL
      const encrypted = encrypt(webhookUrl);
      const username = "Slack Webhook";

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "slack" } },
        create: {
          userId: auth.userId,
          provider: "slack",
          accessToken: JSON.stringify(encrypted),
          username,
          status: "connected",
          enabled: true,
        },
        update: {
          accessToken: JSON.stringify(encrypted),
          username,
          status: "connected",
          enabled: true,
        },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      const msg = e.response?.data || e.message;
      return NextResponse.json({ error: `Slack connection failed: ${msg}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/slack - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "slack" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
