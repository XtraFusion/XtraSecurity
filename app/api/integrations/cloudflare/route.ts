import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

const CF_API = "https://api.cloudflare.com/client/v4";

// GET /api/integrations/cloudflare - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "cloudflare" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, accountId: cfg?.accountId, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/cloudflare - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiToken, accountId } = await req.json();
    if (!apiToken || !accountId) return NextResponse.json({ error: "API Token and Account ID are required" }, { status: 400 });

    // Validate token by fetching account details
    try {
      const res = await axios.get(`${CF_API}/accounts/${accountId}`, {
        headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" },
        timeout: 8000,
      });

      if (!res.data.success) throw new Error(res.data.errors?.[0]?.message || "Invalid credentials");

      const accountName = res.data.result?.name || "Cloudflare Account";
      const encrypted = encrypt(apiToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "cloudflare" } },
        create: { userId: auth.userId, provider: "cloudflare", accessToken: JSON.stringify(encrypted), username: accountName, status: "connected", enabled: true, config: { accountId } },
        update: { accessToken: JSON.stringify(encrypted), username: accountName, status: "connected", enabled: true, config: { accountId } },
      });

      return NextResponse.json({ connected: true, username: accountName, accountId });
    } catch (e: any) {
      const msg = e.response?.data?.errors?.[0]?.message || e.message;
      return NextResponse.json({ error: `Cloudflare authentication failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/cloudflare - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "cloudflare" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
