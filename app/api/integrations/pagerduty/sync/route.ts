import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const PD_API = "https://api.pagerduty.com";
const PD_EVENTS_API = "https://events.pagerduty.com/v2/enqueue";

async function getPDKey(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "pagerduty" } },
  });
  if (!integration?.accessToken) return null;
  try { return decrypt(JSON.parse(integration.accessToken)); } catch { return null; }
}

// GET /api/integrations/pagerduty/sync - List services (as notification targets)
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = await getPDKey(auth.userId);
    if (!apiKey) return NextResponse.json({ error: "PagerDuty not connected" }, { status: 400 });

    const res = await axios.get(`${PD_API}/services?limit=25`, {
      headers: { "Authorization": `Token token=${apiKey}`, "Accept": "application/vnd.pagerduty+json;version=2" },
      timeout: 8000,
    });

    const repos = (res.data?.services || []).map((svc: any) => ({
      id: svc.id,
      name: svc.name,
      fullName: `${svc.name} (${svc.status})`,
      owner: "pagerduty",
      private: true,
      url: svc.html_url,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/pagerduty/sync - Trigger a PagerDuty incident
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, message, severity, integrationKey } = await req.json();
    const apiKey = await getPDKey(auth.userId);
    if (!apiKey) return NextResponse.json({ error: "PagerDuty not connected" }, { status: 400 });

    // Use Events API v2 (requires integration key / routing key)
    // If integrationKey is provided, use Events API else use REST API to create incident
    const pdSeverity = severity === "critical" ? "critical" : severity === "error" ? "error" : severity === "warning" ? "warning" : "info";

    const event = {
      routing_key: integrationKey || apiKey,
      event_action: "trigger",
      payload: {
        summary: title || "XtraSecurity Alert",
        severity: pdSeverity,
        source: "XtraSecurity",
        custom_details: { message, platform: "XtraSecurity" },
      },
    };

    await axios.post(PD_EVENTS_API, event, {
      headers: { "Content-Type": "application/json" },
      timeout: 8000,
    });

    return NextResponse.json({ success: true, summary: { total: 1, synced: 1, failed: 0 }, results: [{ key: "incident", success: true }] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
