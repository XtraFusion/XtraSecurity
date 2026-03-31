import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/discord - Get status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "discord" } },
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

// POST /api/integrations/discord - Connect/Update
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { webhookUrl } = await req.json();
    if (!webhookUrl) return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });

    try {
      // 1. Send test message to Discord (Embed)
      await axios.post(webhookUrl, {
        embeds: [
          {
            title: "✅ XtraSecurity Discord Integration Linked!",
            description: "You will now receive real-time alerts for secret syncs and security events in this channel.",
            color: 5814783,
            footer: {
              text: "Sent from XtraSecurity Dashboard",
            },
            timestamp: new Date().toISOString()
          }
        ]
      });

      // 2. Encrypt and store the webhook URL
      const encrypted = encrypt(webhookUrl);
      const username = "Discord Webhook";

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "discord" } },
        create: {
          userId: auth.userId,
          provider: "discord",
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
      const msg = e.response?.data?.message || e.message;
      return NextResponse.json({ error: `Discord connection failed: ${msg}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/discord - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "discord" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
