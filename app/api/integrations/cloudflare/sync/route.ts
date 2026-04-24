import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const CF_API = "https://api.cloudflare.com/client/v4";

async function getCFCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "cloudflare" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, accountId: cfg?.accountId as string };
  } catch { return null; }
}

// GET /api/integrations/cloudflare/sync - List Workers + Pages projects
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getCFCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Cloudflare not connected" }, { status: 400 });

    const headers = { "Authorization": `Bearer ${creds.token}`, "Content-Type": "application/json" };

    const [workersRes, pagesRes] = await Promise.allSettled([
      axios.get(`${CF_API}/accounts/${creds.accountId}/workers/scripts`, { headers, timeout: 8000 }),
      axios.get(`${CF_API}/accounts/${creds.accountId}/pages/projects`, { headers, timeout: 8000 }),
    ]);

    const repos: any[] = [];

    if (workersRes.status === "fulfilled" && workersRes.value.data?.success) {
      for (const w of workersRes.value.data.result || []) {
        repos.push({ id: `worker:${w.id}`, name: `⚡ ${w.id} (Worker)`, fullName: w.id, owner: "workers", private: true, url: `https://dash.cloudflare.com/${creds.accountId}/workers/services/view/${w.id}` });
      }
    }

    if (pagesRes.status === "fulfilled" && pagesRes.value.data?.success) {
      for (const p of pagesRes.value.data.result || []) {
        repos.push({ id: `pages:${p.name}`, name: `📄 ${p.name} (Pages)`, fullName: p.name, owner: "pages", private: true, url: `https://dash.cloudflare.com/${creds.accountId}/pages/view/${p.name}` });
      }
    }

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/cloudflare/sync - Push secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json();
    if (!projectId || !environment || !targetId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const creds = await getCFCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Cloudflare not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });

    const headers = { "Authorization": `Bearer ${creds.token}`, "Content-Type": "application/json" };
    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;

    const [type, resourceId] = targetId.split(":");

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
        const sanitizedKey = rawKey.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

        if (type === "worker") {
          // Cloudflare Workers secret
          await axios.put(`${CF_API}/accounts/${creds.accountId}/workers/scripts/${resourceId}/secrets`, { name: sanitizedKey, text: decryptedValue, type: "secret_text" }, { headers, timeout: 8000 });
        } else if (type === "pages") {
          // Cloudflare Pages env var (production + preview)
          const envType = environment === "production" ? "production" : "preview";
          const payload = { deploymentConfigs: { [envType]: { env_vars: { [sanitizedKey]: { value: decryptedValue, type: "secret_text" } } } } };
          await axios.patch(`${CF_API}/accounts/${creds.accountId}/pages/projects/${resourceId}`, payload, { headers, timeout: 8000 });
        }

        results.push({ key: sanitizedKey, success: true });
        syncedCount++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.response?.data?.errors?.[0]?.message || e.message });
      }
    }

    return NextResponse.json({ success: true, summary: { total: results.length, synced: syncedCount, failed: results.length - syncedCount }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/cloudflare/sync - Delete a Worker secret
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const targetId = url.searchParams.get("targetId");
    const secretName = url.searchParams.get("secretName");
    if (!targetId || !secretName) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const creds = await getCFCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Cloudflare not connected" }, { status: 400 });

    const [type, resourceId] = targetId.split(":");
    const headers = { "Authorization": `Bearer ${creds.token}` };

    if (type === "worker") {
      await axios.delete(`${CF_API}/accounts/${creds.accountId}/workers/scripts/${resourceId}/secrets/${secretName}`, { headers, timeout: 8000 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
