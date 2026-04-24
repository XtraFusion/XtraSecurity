import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const POSTMAN_API = "https://api.getpostman.com";

async function getPostmanCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "postman" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch { return null; }
}

// GET /api/integrations/postman/sync - List environments
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const key = await getPostmanCreds(auth.userId);
    if (!key) return NextResponse.json({ error: "Postman not connected" }, { status: 400 });

    const res = await axios.get(`${POSTMAN_API}/environments`, { headers: { "X-API-Key": key }, timeout: 8000 });
    const repos = (res.data?.environments || []).map((e: any) => ({
      id: e.uid,
      name: e.name,
      fullName: e.uid,
      owner: e.owner,
      private: true,
      url: `https://postman.com/search?q=${e.uid}`,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/postman/sync - Sync secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json();
    const key = await getPostmanCreds(auth.userId);
    if (!key) return NextResponse.json({ error: "Postman not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found" }, { status: 404 });

    // Fetch existing env to get the values array
    const envRes = await axios.get(`${POSTMAN_API}/environments/${targetId}`, { headers: { "X-API-Key": key } });
    const currentValues = envRes.data?.environment?.values || [];

    const newValues = [...currentValues];
    for (const secret of envSecrets) {
      const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
      const decryptedValue = decrypt(encryptedValue);
      const skey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;

      const idx = newValues.findIndex((v: any) => v.key === skey);
      if (idx > -1) {
        newValues[idx].value = decryptedValue;
      } else {
        newValues.push({ key: skey, value: decryptedValue, enabled: true, type: "secret" });
      }
    }

    await axios.put(`${POSTMAN_API}/environments/${targetId}`, {
      environment: { values: newValues }
    }, { headers: { "X-API-Key": key }, timeout: 8000 });

    return NextResponse.json({ success: true, summary: { total: envSecrets.length, synced: envSecrets.length, failed: 0 }, results: envSecrets.map(s => ({ key: s.key, success: true })) });
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
