import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/sentry - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "sentry" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, org: cfg?.org, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/sentry - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { org, authToken } = await req.json();
    if (!org || !authToken) return NextResponse.json({ error: "Organization slug and Auth Token are required" }, { status: 400 });

    const headers = { "Authorization": `Bearer ${authToken}` };

    try {
      // Validate by fetching org info
      const res = await axios.get(`https://sentry.io/api/0/organizations/${org}/`, { headers, timeout: 8000 });
      const username = res.data?.name || org;
      const encrypted = encrypt(authToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "sentry" } },
        create: { userId: auth.userId, provider: "sentry", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { org } },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { org } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "Sentry authentication failed" }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/sentry
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "sentry" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
