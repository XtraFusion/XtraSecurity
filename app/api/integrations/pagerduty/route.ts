import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

const PD_API = "https://api.pagerduty.com";

// GET /api/integrations/pagerduty - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "pagerduty" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, username: integration.username, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/pagerduty - Connect with REST API Key
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiKey } = await req.json();
    if (!apiKey) return NextResponse.json({ error: "PagerDuty API Key is required" }, { status: 400 });

    try {
      const res = await axios.get(`${PD_API}/users/me`, {
        headers: { "Authorization": `Token token=${apiKey}`, "Accept": "application/vnd.pagerduty+json;version=2" },
        timeout: 8000,
      });

      const username = res.data?.user?.name || res.data?.user?.email || "PagerDuty User";
      const encrypted = encrypt(apiKey);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "pagerduty" } },
        create: { userId: auth.userId, provider: "pagerduty", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.message;
      return NextResponse.json({ error: `PagerDuty authentication failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/pagerduty - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "pagerduty" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
