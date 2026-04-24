import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/telegram - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "telegram" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, chatId: cfg?.chatId, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/telegram - Connect via Bot Token + Chat ID
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { botToken, chatId } = await req.json();
    if (!botToken || !chatId) return NextResponse.json({ error: "Bot Token and Chat ID are required" }, { status: 400 });

    try {
      // Validate bot token
      const botRes = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`, { timeout: 8000 });
      if (!botRes.data?.ok) throw new Error("Invalid bot token");

      const botName = botRes.data.result?.username || "Telegram Bot";

      // Send a test message
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: "🔐 *XtraSecurity Connected*\n\nYou will receive security alerts and sync notifications here.",
        parse_mode: "Markdown",
      }, { timeout: 8000 });

      const encrypted = encrypt(botToken);
      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "telegram" } },
        create: { userId: auth.userId, provider: "telegram", accessToken: JSON.stringify(encrypted), username: `@${botName}`, status: "connected", enabled: true, config: { chatId } },
        update: { accessToken: JSON.stringify(encrypted), username: `@${botName}`, status: "connected", enabled: true, config: { chatId } },
      });

      return NextResponse.json({ connected: true, username: `@${botName}` });
    } catch (e: any) {
      const msg = e.response?.data?.description || e.message;
      return NextResponse.json({ error: `Telegram connection failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/telegram - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "telegram" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
