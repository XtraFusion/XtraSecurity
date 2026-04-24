import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

const TRAVIS_API = "https://api.travis-ci.com";

// GET /api/integrations/travisci - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "travisci" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, username: integration.username, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/travisci - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Travis CI API Token is required" }, { status: 400 });

    try {
      const res = await axios.get(`${TRAVIS_API}/user`, {
        headers: { "Travis-API-Version": "3", "Authorization": `token ${token}` },
        timeout: 8000,
      });

      const username = res.data?.login || res.data?.name || "Travis CI User";
      const encrypted = encrypt(token);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "travisci" } },
        create: { userId: auth.userId, provider: "travisci", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      const msg = e.response?.data?.error_message || e.message;
      return NextResponse.json({ error: `Travis CI authentication failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/travisci - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "travisci" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
