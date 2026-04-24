import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

const SUPABASE_API = "https://api.supabase.com";

// GET /api/integrations/supabase - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "supabase" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, username: integration.username, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/supabase - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { accessToken } = await req.json();
    if (!accessToken) return NextResponse.json({ error: "Supabase Access Token is required" }, { status: 400 });

    try {
      const res = await axios.get(`${SUPABASE_API}/v1/projects`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
        timeout: 8000,
      });

      // Use org name or email from first project, or fallback
      const projects = res.data || [];
      const username = projects[0]?.organization?.name || projects[0]?.name || "Supabase Account";
      const encrypted = encrypt(accessToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "supabase" } },
        create: { userId: auth.userId, provider: "supabase", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      return NextResponse.json({ error: `Supabase authentication failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/supabase - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "supabase" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
