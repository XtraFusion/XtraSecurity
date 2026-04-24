import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const BK_API = "https://api.buildkite.com/v2";

async function getBKCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "buildkite" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, orgSlug: cfg?.orgSlug as string };
  } catch { return null; }
}

// GET /api/integrations/buildkite/sync - List pipelines
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getBKCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Buildkite not connected" }, { status: 400 });

    const res = await axios.get(`${BK_API}/organizations/${creds.orgSlug}/pipelines?per_page=50`, {
      headers: { "Authorization": `Bearer ${creds.token}` },
      timeout: 8000,
    });

    const repos = (res.data || []).map((p: any) => ({
      id: p.slug,
      name: p.name,
      fullName: `${creds.orgSlug}/${p.slug}`,
      owner: creds.orgSlug,
      private: p.visibility === "private",
      url: p.url,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/buildkite/sync - Push secrets as pipeline env vars
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json();
    if (!projectId || !environment || !targetId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const creds = await getBKCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Buildkite not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });

    // Fetch current pipeline env vars
    const pipelineRes = await axios.get(
      `${BK_API}/organizations/${creds.orgSlug}/pipelines/${targetId}`,
      { headers: { "Authorization": `Bearer ${creds.token}` }, timeout: 8000 }
    );

    const currentEnv: Record<string, string> = pipelineRes.data?.env || {};
    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
        const sanitizedKey = rawKey.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
        currentEnv[sanitizedKey] = decryptedValue;
        results.push({ key: sanitizedKey, success: true });
        syncedCount++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.message });
      }
    }

    // Patch pipeline with merged env vars
    await axios.patch(
      `${BK_API}/organizations/${creds.orgSlug}/pipelines/${targetId}`,
      { env: currentEnv },
      { headers: { "Authorization": `Bearer ${creds.token}`, "Content-Type": "application/json" }, timeout: 8000 }
    );

    return NextResponse.json({ success: true, summary: { total: results.length, synced: syncedCount, failed: results.length - syncedCount }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/buildkite/sync - Remove an env var from a pipeline
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const targetId = url.searchParams.get("targetId");
    const secretName = url.searchParams.get("secretName");
    if (!targetId || !secretName) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const creds = await getBKCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Buildkite not connected" }, { status: 400 });

    const pipelineRes = await axios.get(
      `${BK_API}/organizations/${creds.orgSlug}/pipelines/${targetId}`,
      { headers: { "Authorization": `Bearer ${creds.token}` }, timeout: 8000 }
    );

    const currentEnv: Record<string, string> = pipelineRes.data?.env || {};
    delete currentEnv[secretName];

    await axios.patch(
      `${BK_API}/organizations/${creds.orgSlug}/pipelines/${targetId}`,
      { env: currentEnv },
      { headers: { "Authorization": `Bearer ${creds.token}`, "Content-Type": "application/json" }, timeout: 8000 }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
