import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getVaultCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "vault" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, vaultAddr: cfg?.vaultAddr as string, namespace: cfg?.namespace as string | undefined };
  } catch { return null; }
}

// GET /api/integrations/vault/sync - List Vault secret engines/paths
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getVaultCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Vault not connected" }, { status: 400 });

    const baseUrl = creds.vaultAddr.replace(/\/$/, "");
    const headers: Record<string, string> = { "X-Vault-Token": creds.token };
    if (creds.namespace) headers["X-Vault-Namespace"] = creds.namespace;

    // List secret engines (mounts)
    const res = await axios.get(`${baseUrl}/v1/sys/mounts`, { headers, timeout: 8000 });
    const mounts = res.data?.data || res.data || {};

    const repos = Object.entries(mounts)
      .filter(([, v]: any) => v.type === "kv" || v.type === "generic")
      .map(([path, v]: any) => ({
        id: path.replace(/\/$/, ""),
        name: `${path.replace(/\/$/, "")} (${v.type === "kv" ? `KV v${v.options?.version || 1}` : "generic"})`,
        fullName: path,
        owner: "vault",
        private: true,
        url: `${baseUrl}/ui/vault/secrets/${path}`,
      }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/vault/sync - Sync secrets to Vault
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId: mountPath, secretPrefix } = await req.json();
    if (!projectId || !environment || !mountPath) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const creds = await getVaultCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Vault not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });

    const baseUrl = creds.vaultAddr.replace(/\/$/, "");
    const headers: Record<string, string> = { "X-Vault-Token": creds.token, "Content-Type": "application/json" };
    if (creds.namespace) headers["X-Vault-Namespace"] = creds.namespace;

    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;

    // Build the KV data object
    const secretData: Record<string, string> = {};
    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
        secretData[rawKey] = decryptedValue;
        results.push({ key: rawKey, success: true });
        syncedCount++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.message });
      }
    }

    // Write all at once to a KV path - try KV v2 first, fallback to v1
    const kvPath = `${mountPath}/data/xtrasecurity/${environment}`;
    const kvPathV1 = `${mountPath}/xtrasecurity/${environment}`;

    try {
      // KV v2
      await axios.post(`${baseUrl}/v1/${kvPath}`, { data: secretData }, { headers, timeout: 10000 });
    } catch {
      // KV v1 fallback
      await axios.post(`${baseUrl}/v1/${kvPathV1}`, secretData, { headers, timeout: 10000 });
    }

    return NextResponse.json({ success: true, summary: { total: results.length, synced: syncedCount, failed: results.length - syncedCount }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/vault/sync - Delete secret path
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const secretName = url.searchParams.get("secretName");
    const targetId = url.searchParams.get("targetId");

    if (!secretName || !targetId) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const creds = await getVaultCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Vault not connected" }, { status: 400 });

    const baseUrl = creds.vaultAddr.replace(/\/$/, "");
    const headers: Record<string, string> = { "X-Vault-Token": creds.token };
    if (creds.namespace) headers["X-Vault-Namespace"] = creds.namespace;

    await axios.delete(`${baseUrl}/v1/${targetId}/data/${secretName}`, { headers, timeout: 8000 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
