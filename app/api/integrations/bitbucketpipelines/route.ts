import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/bitbucketpipelines - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "bitbucketpipelines" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, username: integration.username, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/bitbucketpipelines - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username, appPassword } = await req.json();
    if (!username || !appPassword) return NextResponse.json({ error: "Username and App Password required" }, { status: 400 });

    const authStr = Buffer.from(`${username}:${appPassword}`).toString("base64");
    const headers = { "Authorization": `Basic ${authStr}` };

    try {
      // Validate by fetching user info
      const res = await axios.get("https://api.bitbucket.org/2.0/user", { headers, timeout: 8000 });
      const display_name = res.data.display_name || username;
      const encrypted = encrypt(appPassword);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "bitbucketpipelines" } },
        create: { userId: auth.userId, provider: "bitbucketpipelines", accessToken: JSON.stringify(encrypted), username: display_name, status: "connected", enabled: true, config: { bbUsername: username } },
        update: { accessToken: JSON.stringify(encrypted), username: display_name, status: "connected", enabled: true, config: { bbUsername: username } },
      });

      return NextResponse.json({ connected: true, username: display_name });
    } catch (e: any) {
      return NextResponse.json({ error: "Bitbucket authentication failed" }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/bitbucketpipelines
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "bitbucketpipelines" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
