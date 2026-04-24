import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// 1Password Secrets Automation usually uses a Connect Server.
// Here we support the 1Password Service Account Token (Newer API).
const OP_API = "https://api.1password.com/v1";

// GET /api/integrations/onepassword - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "onepassword" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, username: integration.username, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/onepassword - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { serviceAccountToken } = await req.json();
    if (!serviceAccountToken) return NextResponse.json({ error: "Service Account Token is required" }, { status: 400 });

    const headers = { "Authorization": `Bearer ${serviceAccountToken}` };

    try {
      // Validate by fetching vaults
      const res = await axios.get(`${OP_API}/vaults`, { headers, timeout: 8000 });
      const username = "1Password Enterprise";
      const encrypted = encrypt(serviceAccountToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "onepassword" } },
        create: { userId: auth.userId, provider: "onepassword", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "1Password Token invalid or lacks permissions" }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/onepassword
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "onepassword" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
