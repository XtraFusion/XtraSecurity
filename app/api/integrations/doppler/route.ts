import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt, decrypt } from "@/lib/encription";

async function getDopplerToken(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "doppler" } },
  });
  if (!integration?.accessToken) return null;
  try { return decrypt(JSON.parse(integration.accessToken)); }
  catch { return null; }
}

// GET — check connection status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "doppler" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, username: integration.username, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — save Doppler token
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await req.json();
    if (!token?.trim()) return NextResponse.json({ error: "Token is required" }, { status: 400 });

    // Validate token
    const meRes = await fetch("https://api.doppler.com/v3/me", {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });

    if (!meRes.ok) {
      return NextResponse.json({ error: "Invalid Doppler token — check permissions" }, { status: 400 });
    }

    const meData = await meRes.json();
    const username =
      meData.user?.username ||
      meData.user?.email ||
      meData.service_token?.name ||
      "doppler-user";

    const encrypted = encrypt(token.trim());

    await prisma.integration.upsert({
      where: { userId_provider: { userId: auth.userId, provider: "doppler" } },
      create: {
        userId: auth.userId,
        provider: "doppler",
        accessToken: JSON.stringify(encrypted),
        username,
        enabled: true,
        status: "connected",
      },
      update: {
        accessToken: JSON.stringify(encrypted),
        username,
        status: "connected",
        enabled: true,
      },
    });

    return NextResponse.json({ connected: true, username });
  } catch (error: any) {
    console.error("Doppler POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "doppler" },
    });

    return NextResponse.json({ success: true, message: "Doppler disconnected" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
