import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

const LINEAR_API = "https://api.linear.app/graphql";

// GET /api/integrations/linear - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "linear" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, username: integration.username, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/linear - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiKey } = await req.json();
    if (!apiKey) return NextResponse.json({ error: "API Key is required" }, { status: 400 });

    const headers = { "Authorization": apiKey, "Content-Type": "application/json" };

    try {
      // Validate by fetching viewer info
      const query = { query: `query { viewer { name email } }` };
      const res = await axios.post(LINEAR_API, query, { headers, timeout: 8000 });
      
      if (res.data?.errors) throw new Error("Invalid API Key");
      
      const username = res.data?.data?.viewer?.name || res.data?.data?.viewer?.email || "Linear User";
      const encrypted = encrypt(apiKey);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "linear" } },
        create: { userId: auth.userId, provider: "linear", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "Linear authentication failed" }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/linear
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "linear" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
