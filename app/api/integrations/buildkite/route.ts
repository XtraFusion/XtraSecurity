import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

const BK_API = "https://api.buildkite.com/v2";

// GET /api/integrations/buildkite - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "buildkite" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, orgSlug: cfg?.orgSlug, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/buildkite - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiToken, orgSlug } = await req.json();
    if (!apiToken || !orgSlug) return NextResponse.json({ error: "API Token and Organization Slug are required" }, { status: 400 });

    const headers = { "Authorization": `Bearer ${apiToken}` };

    try {
      const [userRes, orgRes] = await Promise.all([
        axios.get(`${BK_API}/user`, { headers, timeout: 8000 }),
        axios.get(`${BK_API}/organizations/${orgSlug}`, { headers, timeout: 8000 }),
      ]);

      const username = userRes.data?.name || userRes.data?.email || orgSlug;
      const encrypted = encrypt(apiToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "buildkite" } },
        create: { userId: auth.userId, provider: "buildkite", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { orgSlug } },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { orgSlug } },
      });

      return NextResponse.json({ connected: true, username, orgSlug, orgName: orgRes.data?.name });
    } catch (e: any) {
      const msg = e.response?.status === 401 ? "Invalid API token" : e.response?.status === 404 ? `Organization '${orgSlug}' not found` : e.message;
      return NextResponse.json({ error: `Buildkite authentication failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/buildkite - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "buildkite" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
