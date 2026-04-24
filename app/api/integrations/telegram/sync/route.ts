import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getTelegramCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "telegram" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, chatId: cfg?.chatId as string };
  } catch { return null; }
}

// GET /api/integrations/telegram/sync - Not used (notification-only)
export async function GET(req: NextRequest) {
  return NextResponse.json({ repos: [] });
}

// POST /api/integrations/telegram/sync - Send message to Telegram
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, message, severity } = await req.json();

    const creds = await getTelegramCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Telegram not connected" }, { status: 400 });

    const severityEmoji: Record<string, string> = { critical: "🚨", error: "❌", warning: "⚠️", info: "ℹ️" };
    const emoji = severityEmoji[severity] || "🔔";

    const text = `${emoji} *${title || "XtraSecurity Alert"}*\n\n${message || ""}`;

    await axios.post(`https://api.telegram.org/bot${creds.token}/sendMessage`, {
      chat_id: creds.chatId,
      text,
      parse_mode: "Markdown",
    }, { timeout: 8000 });

    return NextResponse.json({ success: true, summary: { total: 1, synced: 1, failed: 0 }, results: [{ key: "message", success: true }] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
