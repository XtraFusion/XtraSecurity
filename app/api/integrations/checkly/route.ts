import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

const CHECKLY_API = "https://api.checklyhq.com/v1";

// GET /api/integrations/checkly - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "checkly" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, accountId: cfg?.accountId, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/checkly - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiToken, accountId } = await req.json();
    if (!apiToken || !accountId) return NextResponse.json({ error: "API Token and Account ID are required" }, { status: 400 });

    const headers = { "Authorization": `Bearer ${apiToken}`, "X-Checkly-Account": accountId };

    try {
      // Validate by fetching account details
      const res = await axios.get(`${CHECKLY_API}/accounts/${accountId}`, { headers, timeout: 8000 });
      const username = res.data?.name || `Account ${accountId}`;
      const encrypted = encrypt(apiToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "checkly" } },
        create: { userId: auth.userId, provider: "checkly", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { accountId } },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { accountId } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "Checkly authentication failed. Check your Token and Account ID." }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/checkly
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "checkly" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
