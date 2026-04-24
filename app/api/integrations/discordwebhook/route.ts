import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";

// GET /api/integrations/discordwebhook - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "discordwebhook" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, username: integration.username, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/discordwebhook - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { webhookUrl } = await req.json();
    if (!webhookUrl) return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });

    if (!webhookUrl.includes("discord.com/api/webhooks")) {
      return NextResponse.json({ error: "Invalid Discord Webhook URL" }, { status: 400 });
    }

    const username = "Discord Channel";
    const encrypted = encrypt(webhookUrl);

    await prisma.integration.upsert({
      where: { userId_provider: { userId: auth.userId, provider: "discordwebhook" } },
      create: { userId: auth.userId, provider: "discordwebhook", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
      update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
    });

    return NextResponse.json({ connected: true, username });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/discordwebhook
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "discordwebhook" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
