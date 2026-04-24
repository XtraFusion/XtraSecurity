import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const SUPABASE_API = "https://api.supabase.com";

async function getSupabaseToken(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "supabase" } },
  });
  if (!integration?.accessToken) return null;
  try { return decrypt(JSON.parse(integration.accessToken)); } catch { return null; }
}

// GET /api/integrations/supabase/sync - List Supabase projects
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getSupabaseToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Supabase not connected" }, { status: 400 });

    const res = await axios.get(`${SUPABASE_API}/v1/projects`, {
      headers: { "Authorization": `Bearer ${token}` },
      timeout: 8000,
    });

    const repos = (res.data || []).map((p: any) => ({
      id: p.id, // project ref
      name: p.name,
      fullName: `${p.organization_id}/${p.name}`,
      owner: p.organization_id,
      private: true,
      url: `https://supabase.com/dashboard/project/${p.id}`,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/supabase/sync - Push secrets as Supabase project secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json();
    if (!projectId || !environment || !targetId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const token = await getSupabaseToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Supabase not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });

    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;
    const secretsPayload: { name: string; value: string }[] = [];

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
        const sanitizedKey = rawKey.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
        secretsPayload.push({ name: sanitizedKey, value: decryptedValue });
        results.push({ key: sanitizedKey, success: true });
        syncedCount++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.message });
      }
    }

    // Supabase secrets API - bulk upsert
    await axios.post(
      `${SUPABASE_API}/v1/projects/${targetId}/secrets`,
      secretsPayload,
      { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, timeout: 10000 }
    );

    return NextResponse.json({ success: true, summary: { total: results.length, synced: syncedCount, failed: results.length - syncedCount }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/supabase/sync - Delete a Supabase project secret
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const targetId = url.searchParams.get("targetId");
    const secretName = url.searchParams.get("secretName");
    if (!targetId || !secretName) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const token = await getSupabaseToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Supabase not connected" }, { status: 400 });

    await axios.delete(
      `${SUPABASE_API}/v1/projects/${targetId}/secrets`,
      { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, data: [secretName], timeout: 8000 }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
