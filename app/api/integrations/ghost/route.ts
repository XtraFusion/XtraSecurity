import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";
import jwt from "jsonwebtoken";

// GET /api/integrations/ghost - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "ghost" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, url: cfg?.url, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/ghost - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { url, adminKey } = await req.json();
    if (!url || !adminKey) return NextResponse.json({ error: "Ghost URL and Admin API Key are required" }, { status: 400 });

    const [id, secret] = adminKey.split(":");
    if (!id || !secret) return NextResponse.json({ error: "Invalid Admin API Key format" }, { status: 400 });

    const token = jwt.sign({}, Buffer.from(secret, "hex"), {
      keyid: id,
      algorithm: "HS256",
      expiresIn: "5m",
      audience: `/admin/`
    });

    const headers = { "Authorization": `Ghost ${token}` };

    try {
      // Validate by fetching site info
      const res = await axios.get(`${url}/ghost/api/admin/site/`, { headers, timeout: 8000 });
      const username = res.data?.site?.title || "Ghost Site";
      const encrypted = encrypt(adminKey);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "ghost" } },
        create: { userId: auth.userId, provider: "ghost", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { url } },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { url } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "Ghost authentication failed. Check URL and Admin Key." }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/ghost
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "ghost" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
