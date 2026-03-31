import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

const HEROKU_BASE_URL = "https://api.heroku.com";
const HEROKU_HEADERS = {
  "Accept": "application/vnd.heroku+json; version=3",
  "Content-Type": "application/json"
};

// GET /api/integrations/heroku - Get status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "heroku" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    
    return NextResponse.json({
      connected: true,
      username: integration.username,
      connectedAt: integration.createdAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/heroku - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiKey } = await req.json();
    if (!apiKey) return NextResponse.json({ error: "Heroku API Key is required" }, { status: 400 });

    try {
      // Validate by fetching account info
      const res = await axios.get(`${HEROKU_BASE_URL}/account`, {
        headers: { ...HEROKU_HEADERS, "Authorization": `Bearer ${apiKey}` }
      });

      if (res.status !== 200) throw new Error("Invalid API Key");
      
      const username = res.data.email;
      const encrypted = encrypt(apiKey);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "heroku" } },
        create: {
          userId: auth.userId,
          provider: "heroku",
          accessToken: JSON.stringify(encrypted),
          username,
          status: "connected",
          enabled: true,
        },
        update: {
          accessToken: JSON.stringify(encrypted),
          username,
          status: "connected",
          enabled: true,
        },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      return NextResponse.json({ error: `Heroku Authentication failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/heroku - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "heroku" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
