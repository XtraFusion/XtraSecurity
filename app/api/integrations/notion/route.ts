import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/notion - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "notion" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, databaseId: cfg?.databaseId, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/notion - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token, databaseId } = await req.json();
    if (!token || !databaseId) return NextResponse.json({ error: "Token and Database ID are required" }, { status: 400 });

    const headers = { "Authorization": `Bearer ${token}`, "Notion-Version": "2022-06-28" };

    try {
      // Validate by fetching database info
      const res = await axios.get(`https://api.notion.com/v1/databases/${databaseId}`, { headers, timeout: 8000 });
      const username = res.data?.title?.[0]?.plain_text || "Notion Registry";
      const encrypted = encrypt(token);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "notion" } },
        create: { userId: auth.userId, provider: "notion", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { databaseId } },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { databaseId } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "Notion authentication failed or Database ID invalid" }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/notion
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "notion" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
