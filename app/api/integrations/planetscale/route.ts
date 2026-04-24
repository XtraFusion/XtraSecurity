import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

const PS_API = "https://api.planetscale.com/v1";

// GET /api/integrations/planetscale - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "planetscale" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, org: cfg?.org, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/planetscale - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { org, serviceTokenId, serviceToken } = await req.json();
    if (!org || !serviceTokenId || !serviceToken) return NextResponse.json({ error: "Organization, Token ID, and Token are required" }, { status: 400 });

    const headers = { 
      "Authorization": `${serviceTokenId}:${serviceToken}`,
      "Accept": "application/json"
    };

    try {
      // Validate by fetching databases for the org
      const res = await axios.get(`${PS_API}/organizations/${org}/databases`, { headers, timeout: 8000 });
      const username = org;
      const encryptedToken = encrypt(serviceToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "planetscale" } },
        create: { userId: auth.userId, provider: "planetscale", accessToken: JSON.stringify(encryptedToken), username, status: "connected", enabled: true, config: { org, serviceTokenId } },
        update: { accessToken: JSON.stringify(encryptedToken), username, status: "connected", enabled: true, config: { org, serviceTokenId } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      console.error("PlanetScale Connect Error:", e.response?.data || e.message);
      return NextResponse.json({ error: "PlanetScale connection failed. Ensure the Service Token and Org are correct." }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/planetscale
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "planetscale" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
