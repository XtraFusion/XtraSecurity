import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/mattermost - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "mattermost" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, url: cfg?.url, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/mattermost - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { url, token } = await req.json();
    if (!url || !token) return NextResponse.json({ error: "Mattermost URL and Personal Access Token required" }, { status: 400 });

    const baseUrl = url.replace(/\/$/, "");
    const headers = { "Authorization": `Bearer ${token}` };

    try {
      // Validate by fetching current user
      const res = await axios.get(`${baseUrl}/api/v4/users/me`, { headers, timeout: 8000 });
      const username = res.data.username;
      const encrypted = encrypt(token);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "mattermost" } },
        create: { userId: auth.userId, provider: "mattermost", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { url: baseUrl } },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { url: baseUrl } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "Mattermost authentication failed" }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/mattermost
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "mattermost" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
