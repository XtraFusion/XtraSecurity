import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

const TF_API = "https://app.terraform.io/api/v2";

// GET /api/integrations/terraform - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "terraform" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, organization: cfg?.organization, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/terraform - Connect with API Token
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiToken, organization } = await req.json();
    if (!apiToken) return NextResponse.json({ error: "Terraform Cloud API Token is required" }, { status: 400 });

    const headers = { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/vnd.api+json" };

    try {
      const res = await axios.get(`${TF_API}/account/details`, { headers, timeout: 8000 });
      const username = res.data?.data?.attributes?.username || "Terraform User";
      const orgName = organization || res.data?.data?.relationships?.organizations?.data?.[0]?.id || "";
      const encrypted = encrypt(apiToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "terraform" } },
        create: { userId: auth.userId, provider: "terraform", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { organization: orgName } },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { organization: orgName } },
      });

      return NextResponse.json({ connected: true, username, organization: orgName });
    } catch (e: any) {
      const msg = e.response?.data?.errors?.[0]?.detail || e.message;
      return NextResponse.json({ error: `Terraform Cloud authentication failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/terraform - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "terraform" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
