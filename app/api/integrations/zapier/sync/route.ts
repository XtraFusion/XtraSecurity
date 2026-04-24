import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getZapierUrl(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "zapier" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch { return null; }
}

// GET /api/integrations/zapier/sync - Status
export async function GET(req: NextRequest) {
  return NextResponse.json({ repos: [{ id: "zap", name: "Custom Automation", fullName: "Zapier Trigger", owner: "Personal", private: true, url: "#" }] });
}

// POST /api/integrations/zapier/sync - Trigger
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = await getZapierUrl(auth.userId);
    if (!url) return NextResponse.json({ error: "Zapier not connected" }, { status: 400 });

    await axios.post(url, {
      event: "sync_triggered",
      timestamp: new Date().toISOString(),
      user: auth.userId,
      system: "XtraSecurity"
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
