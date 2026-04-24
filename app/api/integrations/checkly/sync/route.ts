import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const CHECKLY_API = "https://api.checklyhq.com/v1";

async function getChecklyCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "checkly" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, accountId: cfg?.accountId };
  } catch { return null; }
}

// GET /api/integrations/checkly/sync - List groups or tests? Let's treat global env vars as the "repo"
export async function GET(req: NextRequest) {
  return NextResponse.json({ repos: [
    { id: "global", name: "Global Environment Variables", fullName: "Global", owner: "Checkly", private: true, url: "https://app.checklyhq.com/settings/variables" }
  ] });
}

// POST /api/integrations/checkly/sync - Push secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, secretPrefix } = await req.json();
    const creds = await getChecklyCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Checkly not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found" }, { status: 404 });

    const headers = { "Authorization": `Bearer ${creds.token}`, "X-Checkly-Account": creds.accountId };
    const results: any[] = [];
    let synced = 0;

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const key = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;

        // Upsert logic: Checkly uses PUT /variables/{key} for create/update
        await axios.put(`${CHECKLY_API}/variables/${key}`, {
          key, value: decryptedValue, locked: true
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
