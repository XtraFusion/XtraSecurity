import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/gitlabselfmanaged - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "gitlabselfmanaged" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, url: cfg?.instanceUrl, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/gitlabselfmanaged - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { instanceUrl, privateToken } = await req.json();
    if (!instanceUrl || !privateToken) return NextResponse.json({ error: "Instance URL and Private Token required" }, { status: 400 });

    const baseUrl = instanceUrl.replace(/\/$/, "");
    const headers = { "PRIVATE-TOKEN": privateToken };

    try {
      // Validate by fetching current user
      const res = await axios.get(`${baseUrl}/api/v4/user`, { headers, timeout: 8000 });
      const username = res.data.username;
      const encrypted = encrypt(privateToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "gitlabselfmanaged" } },
        create: { userId: auth.userId, provider: "gitlabselfmanaged", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { instanceUrl: baseUrl } },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { instanceUrl: baseUrl } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "GitLab authentication failed or Instance URL unreachable" }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/gitlabselfmanaged
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "gitlabselfmanaged" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
