import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const TF_API = "https://app.terraform.io/api/v2";

async function getTFCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "terraform" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, organization: cfg?.organization as string };
  } catch { return null; }
}

const tfHeaders = (token: string) => ({ "Authorization": `Bearer ${token}`, "Content-Type": "application/vnd.api+json" });

// GET /api/integrations/terraform/sync - List workspaces
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getTFCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Terraform Cloud not connected" }, { status: 400 });
    if (!creds.organization) return NextResponse.json({ repos: [], hint: "No organization set" });

    const res = await axios.get(`${TF_API}/organizations/${creds.organization}/workspaces?page[size]=50`, {
      headers: tfHeaders(creds.token),
      timeout: 8000,
    });

    const repos = (res.data?.data || []).map((ws: any) => ({
      id: ws.id,
      name: ws.attributes?.name,
      fullName: `${creds.organization}/${ws.attributes?.name}`,
      owner: creds.organization,
      private: true,
      url: `https://app.terraform.io/app/${creds.organization}/workspaces/${ws.attributes?.name}`,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/terraform/sync - Push secrets as Terraform variables
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json();
    if (!projectId || !environment || !targetId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const creds = await getTFCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Terraform Cloud not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });

    // Get existing variables to enable upsert
    const existingRes = await axios.get(`${TF_API}/workspaces/${targetId}/vars`, { headers: tfHeaders(creds.token), timeout: 8000 });
    const existingVars: Record<string, string> = {};
    for (const v of existingRes.data?.data || []) {
      existingVars[v.attributes?.key] = v.id;
    }

    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
        const sanitizedKey = rawKey.replace(/[^a-zA-Z0-9_]/g, "_");

        const payload = {
          data: {
            type: "vars",
            attributes: { key: sanitizedKey, value: decryptedValue, sensitive: true, category: "env", hcl: false },
          },
        };

        if (existingVars[sanitizedKey]) {
          await axios.patch(`${TF_API}/workspaces/${targetId}/vars/${existingVars[sanitizedKey]}`, payload, { headers: tfHeaders(creds.token), timeout: 8000 });
        } else {
          await axios.post(`${TF_API}/workspaces/${targetId}/vars`, payload, { headers: tfHeaders(creds.token), timeout: 8000 });
        }

        results.push({ key: sanitizedKey, success: true });
        syncedCount++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.response?.data?.errors?.[0]?.detail || e.message });
      }
    }

    return NextResponse.json({ success: true, summary: { total: results.length, synced: syncedCount, failed: results.length - syncedCount }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/terraform/sync - Delete a workspace variable
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const targetId = url.searchParams.get("targetId");
    const secretName = url.searchParams.get("secretName");
    if (!targetId || !secretName) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const creds = await getTFCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Terraform not connected" }, { status: 400 });

    const listRes = await axios.get(`${TF_API}/workspaces/${targetId}/vars`, { headers: tfHeaders(creds.token), timeout: 8000 });
    const variable = (listRes.data?.data || []).find((v: any) => v.attributes?.key === secretName);
    if (!variable) return NextResponse.json({ error: "Variable not found" }, { status: 404 });

    await axios.delete(`${TF_API}/workspaces/${targetId}/vars/${variable.id}`, { headers: tfHeaders(creds.token), timeout: 8000 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
