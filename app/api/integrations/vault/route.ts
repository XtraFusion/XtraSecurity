import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/vault - Get status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "vault" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, vaultAddr: cfg?.vaultAddr, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/vault - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { vaultAddr, token, namespace } = await req.json();
    if (!vaultAddr || !token) return NextResponse.json({ error: "Vault Address and Token are required" }, { status: 400 });

    // Validate with Vault's token lookup endpoint
    try {
      const baseUrl = vaultAddr.replace(/\/$/, "");
      const headers: Record<string, string> = { "X-Vault-Token": token };
      if (namespace) headers["X-Vault-Namespace"] = namespace;

      const res = await axios.get(`${baseUrl}/v1/auth/token/lookup-self`, { headers, timeout: 8000 });
      const displayName = res.data?.data?.display_name || res.data?.data?.entity_id || "Vault Token";

      const encrypted = encrypt(token);
      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "vault" } },
        create: {
          userId: auth.userId, provider: "vault",
          accessToken: JSON.stringify(encrypted),
          username: displayName,
          status: "connected", enabled: true,
          config: { vaultAddr, namespace: namespace || null },
        },
        update: {
          accessToken: JSON.stringify(encrypted),
          username: displayName, status: "connected", enabled: true,
          config: { vaultAddr, namespace: namespace || null },
        },
      });

      return NextResponse.json({ connected: true, username: displayName, vaultAddr });
    } catch (e: any) {
      const msg = e.response?.data?.errors?.[0] || e.message;
      return NextResponse.json({ error: `Vault authentication failed: ${msg}` }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/vault - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "vault" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
