import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

async function getGcpClient(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "gcp" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const serviceAccountJson = decrypt(JSON.parse(integration.accessToken));
    const credentials = JSON.parse(serviceAccountJson);
    return { client: new SecretManagerServiceClient({ credentials }), projectId: credentials.project_id };
  } catch {
    return null;
  }
}

// GET /api/integrations/gcp/sync - List existing secrets
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const gcp = await getGcpClient(auth.userId);
    if (!gcp) return NextResponse.json({ error: "Google Cloud not connected" }, { status: 400 });

    const [secrets] = await gcp.client.listSecrets({ parent: `projects/${gcp.projectId}` });
    
    const repos = (secrets || []).map(s => {
      // name is "projects/{id}/secrets/{name}"
      const name = s.name?.split("/").pop() || "";
      return {
        id: name,
        name: name,
        fullName: name,
        owner: gcp.projectId,
        private: true,
        url: `https://console.cloud.google.com/security/secret-manager/secret/${name}/versions?project=${gcp.projectId}`,
      };
    });

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/gcp/sync - Batch push secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, secretPrefix } = await req.json();
    if (!projectId || !environment) {
      return NextResponse.json({ error: "Missing Project ID or Environment" }, { status: 400 });
    }

    const gcp = await getGcpClient(auth.userId);
    if (!gcp) return NextResponse.json({ error: "Google Cloud not connected" }, { status: 400 });

    // Fetch secrets from XtraSecurity
    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) {
      return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });
    }

    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;

    for (const secret of envSecrets) {
      try {
        // Sanitize key (GCP rule: [a-zA-Z0-9_-]+)
        const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
        const sanitizedKey = rawKey.toUpperCase().replace(/[^A-Z0-9_-]/g, "_");
        
        const parent = `projects/${gcp.projectId}`;
        const secretPath = `${parent}/secrets/${sanitizedKey}`;

        // Get value
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);

        // 1. Check if secret exists
        let exists = false;
        try {
          await gcp.client.getSecret({ name: secretPath });
          exists = true;
        } catch (e: any) {
          if (e.code !== 5) { // 5 = NOT_FOUND
            throw e;
          }
        }

        // 2. Create if missing
        if (!exists) {
          await gcp.client.createSecret({
            parent,
            secretId: sanitizedKey,
            secret: {
              replication: { automatic: {} },
            },
          });
        }

        // 3. Add version
        await gcp.client.addSecretVersion({
          parent: secretPath,
          payload: { data: Buffer.from(decryptedValue, "utf8") },
        });

        results.push({ key: sanitizedKey, success: true });
        syncedCount++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      project: gcp.projectId,
      results,
      summary: { total: results.length, synced: syncedCount, failed: results.length - syncedCount },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/gcp/sync - Delete secret
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const secretName = url.searchParams.get("secretName");

    if (!secretName) {
      return NextResponse.json({ error: "secretName is required" }, { status: 400 });
    }

    const gcp = await getGcpClient(auth.userId);
    if (!gcp) return NextResponse.json({ error: "Google Cloud not connected" }, { status: 400 });

    const secretPath = `projects/${gcp.projectId}/secrets/${secretName}`;

    await gcp.client.deleteSecret({ name: secretPath });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
