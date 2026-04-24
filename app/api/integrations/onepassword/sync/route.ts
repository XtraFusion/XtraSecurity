import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const OP_API = "https://api.1password.com/v1";

async function getOPCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "onepassword" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch { return null; }
}

// GET /api/integrations/onepassword/sync - List Vaults
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getOPCreds(auth.userId);
    if (!token) return NextResponse.json({ error: "1Password not connected" }, { status: 400 });

    const res = await axios.get(`${OP_API}/vaults`, {
      headers: { "Authorization": `Bearer ${token}` },
      timeout: 8000,
    });

    const repos = (res.data || []).map((v: any) => ({
      id: v.id,
      name: v.name,
      fullName: v.name,
      owner: "Vault",
      private: true,
      url: `https://my.1password.com/vaults/${v.id}`,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/onepassword/sync - Push Secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json(); // targetId is vaultId
    const token = await getOPCreds(auth.userId);
    if (!token) return NextResponse.json({ error: "1Password not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found" }, { status: 404 });

    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    const results: any[] = [];
    let synced = 0;

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const key = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;

        // 1Password push logic (creating a Login or Password item)
        await axios.post(`${OP_API}/vaults/${targetId}/items`, {
          category: "LOGIN",
          title: key,
          fields: [{ id: "password", type: "CONCEALED", value: decryptedValue }],
          tags: ["XtraSecurity"]
        }, { headers, timeout: 8000 });

        results.push({ key, success: true });
        synced++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false });
      }
    }

    return NextResponse.json({ success: true, summary: { total: results.length, synced, failed: results.length - synced }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
