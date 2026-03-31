import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

const RENDER_BASE_URL = "https://api.render.com/v1";

// GET /api/integrations/render - Get status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "render" } },
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

// POST /api/integrations/render - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiKey } = await req.json();
    if (!apiKey) return NextResponse.json({ error: "Render API Key is required" }, { status: 400 });

    try {
      // Validate by fetching services (v1)
      const res = await axios.get(`${RENDER_BASE_URL}/services`, {
        headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
      });

      if (res.status !== 200) throw new Error("Invalid API Key");
      
      const username = "Render Workspace"; // No direct 'me' endpoint, using workspace label
      const encrypted = encrypt(apiKey);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "render" } },
        create: {
          userId: auth.userId,
          provider: "render",
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
      return NextResponse.json({ error: `Render Authentication failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/render - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "render" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
