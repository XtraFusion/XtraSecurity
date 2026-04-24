import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/opsgenie - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "opsgenie" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, username: integration.username, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/opsgenie - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiKey, region } = await req.json(); // region: 'US' or 'EU'
    if (!apiKey) return NextResponse.json({ error: "API Key is required" }, { status: 400 });

    const baseUrl = region === "EU" ? "https://api.eu.opsgenie.com" : "https://api.opsgenie.com";
    const headers = { "Authorization": `GenieKey ${apiKey}` };

    try {
      // Validate by fetching user details or self
      const res = await axios.get(`${baseUrl}/v2/users/me`, { headers, timeout: 8000 });
      const username = res.data?.data?.username || "Opsgenie User";
      const encrypted = encrypt(apiKey);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "opsgenie" } },
        create: { userId: auth.userId, provider: "opsgenie", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { region } },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { region } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "Invalid Opsgenie API Key" }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/opsgenie
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "opsgenie" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
