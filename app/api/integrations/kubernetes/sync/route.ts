import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";
import https from "https";

async function getK8sCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "kubernetes" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, apiServer: cfg?.apiServer, skipTLS: cfg?.skipTLS };
  } catch { return null; }
}

// GET /api/integrations/kubernetes/sync - List Namespaces
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getK8sCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Kubernetes not connected" }, { status: 400 });

    const agent = new https.Agent({ rejectUnauthorized: !creds.skipTLS });
    const res = await axios.get(`${creds.apiServer}/api/v1/namespaces`, { 
      headers: { "Authorization": `Bearer ${creds.token}` },
      httpsAgent: agent,
      timeout: 8000 
    });

    const repos = (res.data?.items || []).map((ns: any) => ({
      id: ns.metadata.name,
      name: ns.metadata.name,
      fullName: ns.metadata.name,
      owner: "Namespace",
      private: true,
      url: `${creds.apiServer}/api/v1/namespaces/${ns.metadata.name}`,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/kubernetes/sync - Sync Secrets to a Namespace
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json(); // targetId is namespace
    const creds = await getK8sCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Kubernetes not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found" }, { status: 404 });

    const agent = new https.Agent({ rejectUnauthorized: !creds.skipTLS });
    const headers = { "Authorization": `Bearer ${creds.token}`, "Content-Type": "application/json" };
    
    // We create/update an Opaque secret named 'xtrasecurity-secrets' or prefix-based
    const secretName = secretPrefix ? `${secretPrefix?.toLowerCase()}-secrets` : "xtrasecurity-secrets";
    
    // Prepare Data (K8s secrets must be base64 encoded)
    const data: Record<string, string> = {};
    for (const s of envSecrets) {
      const encryptedValue = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
      const decryptedValue = decrypt(encryptedValue);
      data[s.key] = Buffer.from(decryptedValue).toString("base64");
    }

    // Upsert logic for K8s: Check if secret exists
    try {
      await axios.get(`${creds.apiServer}/api/v1/namespaces/${targetId}/secrets/${secretName}`, { headers, httpsAgent: agent });
      // Update (PATCH)
      await axios.patch(`${creds.apiServer}/api/v1/namespaces/${targetId}/secrets/${secretName}`, {
        data: data
      }, { headers: { ...headers, "Content-Type": "application/strategic-merge-patch+json" }, httpsAgent: agent, timeout: 8000 });
    } catch (e: any) {
      if (e.response?.status === 404) {
        // Create
        await axios.post(`${creds.apiServer}/api/v1/namespaces/${targetId}/secrets`, {
          apiVersion: "v1",
          kind: "Secret",
          metadata: { name: secretName },
          type: "Opaque",
          data: data
        }, { headers, httpsAgent: agent, timeout: 8000 });
      } else {
        throw e;
      }
    }

    return NextResponse.json({ success: true, summary: { total: envSecrets.length, synced: envSecrets.length, failed: 0 }, results: envSecrets.map(s => ({ key: s.key, success: true })) });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
