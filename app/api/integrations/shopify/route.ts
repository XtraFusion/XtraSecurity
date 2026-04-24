import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/shopify - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "shopify" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, shop: cfg?.shop, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/shopify - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { shop, accessToken } = await req.json();
    if (!shop || !accessToken) return NextResponse.json({ error: "Shop URL and Admin Access Token are required" }, { status: 400 });

    const shopUrl = shop.includes(".") ? shop : `${shop}.myshopify.com`;
    const headers = { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" };

    try {
      // Validate by fetching shop details
      const res = await axios.get(`https://${shopUrl}/admin/api/2024-01/shop.json`, { headers, timeout: 8000 });
      const username = res.data?.shop?.name || shopUrl;
      const encrypted = encrypt(accessToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "shopify" } },
        create: { userId: auth.userId, provider: "shopify", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { shop: shopUrl } },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { shop: shopUrl } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "Shopify verification failed. Ensure the shop URL and token are correct." }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/shopify
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "shopify" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
