import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/teams - Get status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "teams" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, username: integration.username, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/teams - Connect via Incoming Webhook URL
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { webhookUrl } = await req.json();
    if (!webhookUrl) return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });

    // Validate the webhook is reachable by sending a test message
    try {
      const testPayload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: "6366F1",
        summary: "XtraSecurity Connected",
        sections: [{
          activityTitle: "🔐 XtraSecurity Connected",
          activityText: "Microsoft Teams integration is now active. You will receive alerts here.",
        }]
      };
      const res = await axios.post(webhookUrl, testPayload, {
        headers: { "Content-Type": "application/json" },
        timeout: 8000,
      });
      if (res.status !== 200 && res.status !== 202 && res.data !== 1) {
        throw new Error(`Teams webhook returned status ${res.status}`);
      }
    } catch (e: any) {
      return NextResponse.json({ error: `Teams webhook validation failed: ${e.message}` }, { status: 401 });
    }

    const encrypted = encrypt(webhookUrl);
    await prisma.integration.upsert({
      where: { userId_provider: { userId: auth.userId, provider: "teams" } },
      create: { userId: auth.userId, provider: "teams", accessToken: JSON.stringify(encrypted), username: "Teams Webhook", status: "connected", enabled: true },
      update: { accessToken: JSON.stringify(encrypted), username: "Teams Webhook", status: "connected", enabled: true },
    });

    return NextResponse.json({ connected: true, username: "Teams Webhook" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/teams - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "teams" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
