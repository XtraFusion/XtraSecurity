import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/jenkins - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "jenkins" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, jenkinsUrl: cfg?.jenkinsUrl, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/jenkins - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jenkinsUrl, username, apiToken } = await req.json();
    if (!jenkinsUrl || !username || !apiToken) return NextResponse.json({ error: "Jenkins URL, Username and API Token are required" }, { status: 400 });

    const baseUrl = jenkinsUrl.replace(/\/$/, "");
    try {
      const res = await axios.get(`${baseUrl}/me/api/json`, {
        auth: { username, password: apiToken },
        timeout: 8000,
      });

      const fullName = res.data?.fullName || username;
      const encryptedToken = encrypt(apiToken);
      const encryptedUser = encrypt(username);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "jenkins" } },
        create: {
          userId: auth.userId, provider: "jenkins",
          accessToken: JSON.stringify(encryptedToken),
          username: fullName, status: "connected", enabled: true,
          config: { jenkinsUrl: baseUrl, username, encryptedUser: JSON.stringify(encryptedUser) },
        },
        update: {
          accessToken: JSON.stringify(encryptedToken),
          username: fullName, status: "connected", enabled: true,
          config: { jenkinsUrl: baseUrl, username, encryptedUser: JSON.stringify(encryptedUser) },
        },
      });

      return NextResponse.json({ connected: true, username: fullName });
    } catch (e: any) {
      const msg = e.response?.status === 401 ? "Invalid credentials" : e.message;
      return NextResponse.json({ error: `Jenkins authentication failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/jenkins - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "jenkins" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
