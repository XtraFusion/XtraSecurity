import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getTeamsWebhook(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "teams" } },
  });
  if (!integration?.accessToken) return null;
  try { return decrypt(JSON.parse(integration.accessToken)); } catch { return null; }
}

// GET /api/integrations/teams/sync - Not used for secret listing (Teams is notify-only)
export async function GET(req: NextRequest) {
  return NextResponse.json({ repos: [] });
}

// POST /api/integrations/teams/sync - Send a notification to Teams channel
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, message, severity } = await req.json();

    const webhookUrl = await getTeamsWebhook(auth.userId);
    if (!webhookUrl) return NextResponse.json({ error: "Microsoft Teams not connected" }, { status: 400 });

    const colorMap: Record<string, string> = { info: "4A90D9", warning: "F39C12", error: "E74C3C", critical: "8B0000" };
    const color = colorMap[severity] || colorMap.info;

    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: color,
      summary: title,
      sections: [{
        activityTitle: `🔐 ${title}`,
        activityText: message,
        facts: [{ name: "Severity", value: severity?.toUpperCase() || "INFO" }, { name: "Source", value: "XtraSecurity" }],
      }]
    };

    await axios.post(webhookUrl, payload, { headers: { "Content-Type": "application/json" }, timeout: 8000 });

    return NextResponse.json({ success: true, summary: { total: 1, synced: 1, failed: 0 }, results: [{ key: "notification", success: true }] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
