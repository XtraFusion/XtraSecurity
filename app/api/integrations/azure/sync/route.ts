import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import { SecretClient } from "@azure/keyvault-secrets";
import { ClientSecretCredential } from "@azure/identity";

async function getAzureClient(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "azure" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const payload = decrypt(JSON.parse(integration.accessToken));
    const { tenantId, clientId, clientSecret, vaultName } = JSON.parse(payload);
    const vaultUrl = `https://${vaultName}.vault.azure.net`;
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    return { client: new SecretClient(vaultUrl, credential), vaultName };
  } catch {
    return null;
  }
}

// GET /api/integrations/azure/sync - List existing secrets
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const azure = await getAzureClient(auth.userId);
    if (!azure) return NextResponse.json({ error: "Azure not connected" }, { status: 400 });

    const secrets = azure.client.listPropertiesOfSecrets();
    const repos = [];
    
    for await (const secret of secrets) {
      if (secret.managed) continue; // Skip managed secrets (storage, etc.)
      repos.push({
        id: secret.name,
        name: secret.name,
        fullName: secret.name,
        owner: azure.vaultName,
        private: true,
        url: `https://portal.azure.com/#view/Microsoft_Azure_KeyVault/SecretSelectItemsView/vaultId/${encodeURIComponent(azure.vaultName)}`,
      });
    }

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/azure/sync - Batch push secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, secretPrefix } = await req.json();
    if (!projectId || !environment) {
      return NextResponse.json({ error: "Missing Project ID or Environment" }, { status: 400 });
    }

    const azure = await getAzureClient(auth.userId);
    if (!azure) return NextResponse.json({ error: "Azure not connected" }, { status: 400 });

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
        // Sanitize key (Azure rule: ^[0-9a-zA-Z-]+$)
        const rawKey = secretPrefix ? `${secretPrefix}-${secret.key}` : secret.key;
        const sanitizedKey = rawKey.replace(/[^a-zA-Z0-9-]/g, "-");
        
        // Decrypt value
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);

        // Native versioning handled by setSecret
        await azure.client.setSecret(sanitizedKey, decryptedValue);

        results.push({ key: sanitizedKey, success: true });
        syncedCount++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      vault: azure.vaultName,
      results,
      summary: { total: results.length, synced: syncedCount, failed: results.length - syncedCount },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/azure/sync - Delete secret
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const secretName = url.searchParams.get("secretName");

    if (!secretName) {
      return NextResponse.json({ error: "secretName is required" }, { status: 400 });
    }

    const azure = await getAzureClient(auth.userId);
    if (!azure) return NextResponse.json({ error: "Azure not connected" }, { status: 400 });

    // Azure deleteSecret returns a poller for soft-delete
    await azure.client.beginDeleteSecret(secretName);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
