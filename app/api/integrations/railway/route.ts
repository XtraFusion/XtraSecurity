import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt, decrypt } from "@/lib/encription";
import axios from "axios";

const RAILWAY_GRAPHQL_URL = "https://backboard.railway.app/graphql/v2";

// GET /api/integrations/railway - Get status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "railway" } },
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

// POST /api/integrations/railway - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Railway API Key is required" }, { status: 400 });

    // Validate with Railway GraphQL
    try {
      const q = `query { me { name email } }`;
      const res = await axios.post(RAILWAY_GRAPHQL_URL, { query: q }, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.data.errors) throw new Error(res.data.errors[0].message);
      
      const username = res.data.data.me.email || res.data.data.me.name || "Railway User";
      const encrypted = encrypt(token);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "railway" } },
        create: {
          userId: auth.userId,
          provider: "railway",
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
      const msg = e.response?.data?.errors?.[0]?.message || e.message;
      return NextResponse.json({ error: `Railway Authentication failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/railway - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "railway" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
