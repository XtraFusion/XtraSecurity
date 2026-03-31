import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt, decrypt } from "@/lib/encription";
import axios from "axios";

const FLY_GRAPHQL_URL = "https://api.fly.io/graphql";

// GET /api/integrations/fly - Get status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "fly" } },
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

// POST /api/integrations/fly - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Fly.io API Token is required" }, { status: 400 });

    // Validate with Fly GraphQL
    try {
      const q = `query { viewer { email } }`;
      const res = await axios.post(FLY_GRAPHQL_URL, { query: q }, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.data.errors) throw new Error(res.data.errors[0].message);
      
      const username = res.data.data.viewer.email || "Fly.io User";
      const encrypted = encrypt(token);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "fly" } },
        create: {
          userId: auth.userId,
          provider: "fly",
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
      return NextResponse.json({ error: `Fly.io Authentication failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/fly - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "fly" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
