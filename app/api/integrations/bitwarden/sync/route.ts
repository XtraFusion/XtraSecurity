import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const BITWARDEN_API = "https://api.bitwarden.com/secrets-manager";

async function getBitwardenCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "bitwarden" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch { return null; }
}

// GET /api/integrations/bitwarden/sync - List Projects
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getBitwardenCreds(auth.userId);
    if (!token) return NextResponse.json({ error: "Bitwarden not connected" }, { status: 400 });

    const res = await axios.get(`${BITWARDEN_API}/projects`, {
      headers: { "Authorization": `Bearer ${token}` },
      timeout: 8000,
    });

    const repos = (res.data?.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      fullName: p.id,
      owner: "Project",
      private: true,
      url: `https://vault.bitwarden.com/#/secrets-manager/${p.id}`,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/bitwarden/sync - Sync Secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json(); // targetId is projectUid
    const token = await getBitwardenCreds(auth.userId);
    if (!token) return NextResponse.json({ error: "Bitwarden not connected" }, { status: 400 });

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

        // Bitwarden Secrets Manager upsert: Check by key or just create
        // The API prefers creating secrets associated with projects
        await axios.post(`${BITWARDEN_API}/secrets`, {
          key, value: decryptedValue, notes: "Managed by XtraSecurity", projectIds: [targetId]
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
