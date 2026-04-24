import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getDiscordUrl(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "discordwebhook" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch { return null; }
}

// GET /api/integrations/discordwebhook/sync - Status
export async function GET(req: NextRequest) {
  return NextResponse.json({ repos: [{ id: "discord", name: "Security Alerts", fullName: "Discord Channel", owner: "Discord", private: true, url: "#" }] });
}

// POST /api/integrations/discordwebhook/sync - Notify
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = await getDiscordUrl(auth.userId);
    if (!url) return NextResponse.json({ error: "Discord not connected" }, { status: 400 });

    const { projectId } = await req.json();
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    await axios.post(url, {
      embeds: [{
        title: "🔐 XtraSecurity Sync Triggered",
        description: `Secrets synchronization initiated for project: **${project?.name || "Unknown"}**`,
        color: 5814783,
        timestamp: new Date().toISOString(),
        footer: { text: "XtraSecurity Monitoring" }
      }]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
