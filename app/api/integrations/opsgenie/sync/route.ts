import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getGenieCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "opsgenie" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const apiKey = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { apiKey, region: cfg?.region };
  } catch { return null; }
}

// GET - notification-only
export async function GET() {
  return NextResponse.json({ repos: [] });
}

// POST /api/integrations/opsgenie/sync - Trigger Alert
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, message, severity } = await req.json();
    const creds = await getGenieCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Opsgenie not connected" }, { status: 400 });

    const baseUrl = creds.region === "EU" ? "https://api.eu.opsgenie.com" : "https://api.opsgenie.com";
    
    // Severity mapping
    const priority = severity === "critical" ? "P1" : severity === "error" ? "P2" : severity === "warning" ? "P3" : "P5";

    await axios.post(`${baseUrl}/v2/alerts`, {
      message: title || "XtraSecurity Alert",
      description: message || "",
      priority: priority,
      tags: ["xtrasecurity", severity || "info"],
      source: "XtraSecurity Platform",
    }, {
      headers: { "Authorization": `GenieKey ${creds.apiKey}`, "Content-Type": "application/json" },
      timeout: 8000,
    });

    return NextResponse.json({ success: true, summary: { total: 1, synced: 1, failed: 0 }, results: [{ key: "opsgenie", success: true }] });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
