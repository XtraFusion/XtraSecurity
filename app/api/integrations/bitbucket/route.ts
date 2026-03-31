import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt, decrypt } from "@/lib/encription";

// GET /api/integrations/bitbucket - Get status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "bitbucket" } },
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

// POST /api/integrations/bitbucket - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username, appPassword } = await req.json();
    if (!username || !appPassword) {
      return NextResponse.json({ error: "Username and App Password are required" }, { status: 400 });
    }

    // Validate with Bitbucket API
    const credentials = Buffer.from(`${username}:${appPassword}`).toString("base64");
    const res = await fetch("https://api.bitbucket.org/2.0/user", {
      headers: { Authorization: `Basic ${credentials}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid Bitbucket credentials" }, { status: 401 });
    }

    const userData = await res.json();
    const bitbucketUsername = userData.username || userData.nickname;

    const encrypted = encrypt(appPassword);

    await prisma.integration.upsert({
      where: { userId_provider: { userId: auth.userId, provider: "bitbucket" } },
      create: {
        userId: auth.userId,
        provider: "bitbucket",
        accessToken: JSON.stringify(encrypted),
        username: username, // Store the provided username for auth
        status: "connected",
        enabled: true,
      },
      update: {
        accessToken: JSON.stringify(encrypted),
        username: username,
        status: "connected",
        enabled: true,
      },
    });

    return NextResponse.json({ connected: true, username: bitbucketUsername });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/bitbucket - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "bitbucket" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
