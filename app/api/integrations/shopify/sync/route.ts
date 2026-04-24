import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getShopifyCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "shopify" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, shop: cfg?.shop };
  } catch { return null; }
}

// GET /api/integrations/shopify/sync - List shop metafields namespace (dummy "repo")
export async function GET() {
  return NextResponse.json({ repos: [
    { id: "shop_meta", name: "Shop Metafields (xtrasecurity namespace)", fullName: "shop_meta", owner: "Shopify Store", private: true, url: "" }
  ] });
}

// POST /api/integrations/shopify/sync - Sync secrets to Metafields
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, secretPrefix } = await req.json();
    const creds = await getShopifyCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Shopify not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found" }, { status: 404 });

    const headers = { "X-Shopify-Access-Token": creds.token, "Content-Type": "application/json" };
    const results: any[] = [];
    let synced = 0;

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const key = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;

        // Sync to shop metafields
        await axios.post(`https://${creds.shop}/admin/api/2024-01/metafields.json`, {
          metafield: {
            namespace: "xtrasecurity",
            key: key,
            value: decryptedValue,
            type: "single_line_text_field"
          }
        }, { headers, timeout: 8000 });

        results.push({ key, success: true });
        synced++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.message });
      }
    }

    return NextResponse.json({ success: true, summary: { total: results.length, synced, failed: results.length - synced }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
