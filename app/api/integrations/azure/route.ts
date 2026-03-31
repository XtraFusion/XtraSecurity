import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt, decrypt } from "@/lib/encription";
import { SecretClient } from "@azure/keyvault-secrets";
import { ClientSecretCredential } from "@azure/identity";

// GET /api/integrations/azure - Get status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "azure" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    
    // Username stores the Vault Name for Azure
    return NextResponse.json({
      connected: true,
      vaultName: integration.username,
      connectedAt: integration.createdAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/azure - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId, clientId, clientSecret, vaultName } = await req.json();
    if (!tenantId || !clientId || !clientSecret || !vaultName) {
      return NextResponse.json({ error: "Missing required fields (Tenant ID, Client ID, Client Secret, Vault Name)" }, { status: 400 });
    }

    const vaultUrl = `https://${vaultName}.vault.azure.net`;

    // Validate with Azure Key Vault Client
    try {
      const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
      const client = new SecretClient(vaultUrl, credential);
      // Just test a list call with a tiny page size to verify access
      const secrets = client.listPropertiesOfSecrets();
      await secrets.next();
    } catch (e: any) {
      return NextResponse.json({ error: `Azure Authentication failed. Ensure the Service Principal has 'Key Vault Secrets Officer' role on the vault. Details: ${e.message}` }, { status: 401 });
    }

    const payload = JSON.stringify({ tenantId, clientId, clientSecret, vaultName });
    const encrypted = encrypt(payload);

    await prisma.integration.upsert({
      where: { userId_provider: { userId: auth.userId, provider: "azure" } },
      create: {
        userId: auth.userId,
        provider: "azure",
        accessToken: JSON.stringify(encrypted),
        username: vaultName, // Store Vault Name as identifier
        status: "connected",
        enabled: true,
      },
      update: {
        accessToken: JSON.stringify(encrypted),
        username: vaultName,
        status: "connected",
        enabled: true,
      },
    });

    return NextResponse.json({ connected: true, vaultName });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/azure - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "azure" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
