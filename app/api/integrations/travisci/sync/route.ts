import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const TRAVIS_API = "https://api.travis-ci.com";

async function getTravisToken(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "travisci" } },
  });
  if (!integration?.accessToken) return null;
  try { return decrypt(JSON.parse(integration.accessToken)); } catch { return null; }
}

const travisHeaders = (token: string) => ({ "Travis-API-Version": "3", "Authorization": `token ${token}` });

// GET /api/integrations/travisci/sync - List repositories
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getTravisToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Travis CI not connected" }, { status: 400 });

    const res = await axios.get(`${TRAVIS_API}/repos?limit=50&active=true`, {
      headers: travisHeaders(token),
      timeout: 8000,
    });

    const repos = (res.data?.repositories || []).map((r: any) => ({
      id: r.slug, // owner/repo format
      name: r.name,
      fullName: r.slug,
      owner: r.owner?.login || "",
      private: r.private,
      url: `https://app.travis-ci.com/github/${r.slug}`,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/travisci/sync - Push env vars to Travis CI repo
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json();
    if (!projectId || !environment || !targetId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const token = await getTravisToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Travis CI not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });

    // Get existing env vars for the repo so we can update vs create
    const existingRes = await axios.get(`${TRAVIS_API}/repo/${encodeURIComponent(targetId)}/env_vars`, {
      headers: travisHeaders(token),
      timeout: 8000,
    });
    const existingVars: Record<string, string> = {};
    for (const ev of existingRes.data?.env_vars || []) {
      existingVars[ev.name] = ev.id;
    }

    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
        const sanitizedKey = rawKey.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

        const payload = { env_var: { name: sanitizedKey, value: decryptedValue, public: false } };

        if (existingVars[sanitizedKey]) {
          // PATCH to update
          await axios.patch(`${TRAVIS_API}/repo/${encodeURIComponent(targetId)}/env_var/${existingVars[sanitizedKey]}`, payload, { headers: travisHeaders(token), timeout: 8000 });
        } else {
          // POST to create
          await axios.post(`${TRAVIS_API}/repo/${encodeURIComponent(targetId)}/env_vars`, payload, { headers: travisHeaders(token), timeout: 8000 });
        }

        results.push({ key: sanitizedKey, success: true });
        syncedCount++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.response?.data?.error_message || e.message });
      }
    }

    return NextResponse.json({ success: true, summary: { total: results.length, synced: syncedCount, failed: results.length - syncedCount }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/travisci/sync - Delete env var
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const targetId = url.searchParams.get("targetId");
    const secretName = url.searchParams.get("secretName");
    if (!targetId || !secretName) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const token = await getTravisToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Travis CI not connected" }, { status: 400 });

    // Get the env var ID first
    const listRes = await axios.get(`${TRAVIS_API}/repo/${encodeURIComponent(targetId)}/env_vars`, { headers: travisHeaders(token), timeout: 8000 });
    const envVar = (listRes.data?.env_vars || []).find((e: any) => e.name === secretName);
    if (!envVar) return NextResponse.json({ error: "Env var not found" }, { status: 404 });

    await axios.delete(`${TRAVIS_API}/repo/${encodeURIComponent(targetId)}/env_var/${envVar.id}`, { headers: travisHeaders(token), timeout: 8000 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
