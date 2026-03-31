import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import {
  SecretsManagerClient,
  ListSecretsCommand,
  CreateSecretCommand,
  PutSecretValueCommand,
  GetSecretValueCommand,
  DeleteSecretCommand,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";

interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

async function getAwsClient(userId: string): Promise<{ client: SecretsManagerClient; region: string } | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "aws" } },
  });
  if (!integration?.accessToken) return null;

  try {
    const encrypted = JSON.parse(integration.accessToken);
    const raw = decrypt(encrypted);
    const creds: AwsCredentials = JSON.parse(raw);
    const client = new SecretsManagerClient({
      region: creds.region,
      credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey },
    });
    return { client, region: creds.region };
  } catch {
    return null;
  }
}

// GET /api/integrations/aws/sync — list secrets + optionally compare
// ?projectId=&environment= for comparison mode
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const environment = url.searchParams.get("environment");

    const result = await getAwsClient(auth.userId);
    if (!result) return NextResponse.json({ error: "AWS not connected" }, { status: 400 });
    const { client, region } = result;

    // List all secrets
    const listRes = await client.send(new ListSecretsCommand({ MaxResults: 100 }));
    const awsSecrets = (listRes.SecretList || []).map((s) => ({
      id: s.ARN || s.Name || "",
      name: s.Name || "",
      fullName: s.Name || "",
      owner: region,
      private: true,
      url: `https://${region}.console.aws.amazon.com/secretsmanager/home?region=${region}#!/secret?name=${encodeURIComponent(s.Name || "")}`,
      arn: s.ARN,
    }));

    // If compare mode — include XtraSecurity vs AWS diff
    if (projectId && environment) {
      const allSecrets = await prisma.secret.findMany({
        where: { projectId },
        select: { key: true, value: true, environmentType: true },
      });
      const xtraSecrets = allSecrets.filter(
        (s) => s.environmentType?.toLowerCase() === environment.toLowerCase()
      );

      const awsKeySet = new Set(awsSecrets.map((s) => s.name));
      const xtraKeySet = new Set(xtraSecrets.map((s) => s.key.toUpperCase()));

      const items: { key: string; status: string }[] = [];

      for (const s of xtraSecrets) {
        const keyName = s.key.toUpperCase();
        items.push({ key: keyName, status: awsKeySet.has(keyName) ? "in_sync" : "new" });
      }

      for (const awsName of awsKeySet) {
        if (!xtraKeySet.has(awsName)) {
          items.push({ key: awsName, status: "only_remote" });
        }
      }

      return NextResponse.json({ repos: awsSecrets, compare: { items } });
    }

    return NextResponse.json({ repos: awsSecrets });
  } catch (error: any) {
    console.error("AWS list secrets error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/aws/sync — push secrets to AWS Secrets Manager
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, secretPrefix, pathPrefix } = await req.json();

    if (!projectId || !environment) {
      return NextResponse.json({ error: "projectId and environment are required" }, { status: 400 });
    }

    const result = await getAwsClient(auth.userId);
    if (!result) return NextResponse.json({ error: "AWS not connected" }, { status: 400 });
    const { client } = result;

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: auth.userId },
          { teamProjects: { some: { team: { members: { some: { userId: auth.userId, status: "active" } } } } } },
        ],
      },
    });

    if (!project) return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const secrets = allSecrets.filter(
      (s) => s.environmentType?.toLowerCase() === environment.toLowerCase()
    );

    if (secrets.length === 0) {
      const available = [...new Set(allSecrets.map((s) => s.environmentType).filter(Boolean))];
      return NextResponse.json(
        { error: `No secrets for "${environment}". Available: ${available.join(", ") || "none"}` },
        { status: 404 }
      );
    }

    const syncResults: { key: string; success: boolean; error?: string }[] = [];

    for (const secret of secrets) {
      try {
        // Decrypt value
        let decryptedValue: string;
        try {
          const rawValue = Array.isArray(secret.value) ? secret.value[0] : secret.value;
          const encryptedValue = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
          decryptedValue = decrypt(encryptedValue);
        } catch (decryptErr: any) {
          syncResults.push({ key: secret.key, success: false, error: `Decrypt failed: ${decryptErr.message}` });
          continue;
        }

        // Build secret name: optional path prefix + optional prefix + key
        const keyPart = secretPrefix ? `${secretPrefix}_${secret.key}`.toUpperCase() : secret.key.toUpperCase();
        const secretName = pathPrefix ? `${pathPrefix}/${keyPart}` : keyPart;

        // Check if secret exists
        let exists = false;
        try {
          await client.send(new DescribeSecretCommand({ SecretId: secretName }));
          exists = true;
        } catch {}

        if (exists) {
          await client.send(new PutSecretValueCommand({
            SecretId: secretName,
            SecretString: decryptedValue,
          }));
        } else {
          await client.send(new CreateSecretCommand({
            Name: secretName,
            SecretString: decryptedValue,
            Description: `Synced from XtraSecurity — project: ${projectId}, env: ${environment}`,
          }));
        }

        syncResults.push({ key: secretName, success: true });
      } catch (err: any) {
        syncResults.push({ key: secret.key, success: false, error: err.message });
      }
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: "aws_sync",
          entity: "project",
          entityId: projectId,
          changes: { environment, secretsCount: secrets.length, successCount: syncResults.filter((r) => r.success).length },
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      repo: `AWS Secrets Manager (${environment})`,
      results: syncResults,
      summary: {
        total: syncResults.length,
        synced: syncResults.filter((r) => r.success).length,
        failed: syncResults.filter((r) => !r.success).length,
      },
    });
  } catch (error: any) {
    console.error("AWS sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/aws/sync?secretName= — delete one secret from AWS
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const secretName = url.searchParams.get("secretName");
    if (!secretName) return NextResponse.json({ error: "secretName is required" }, { status: 400 });

    const result = await getAwsClient(auth.userId);
    if (!result) return NextResponse.json({ error: "AWS not connected" }, { status: 400 });
    const { client } = result;

    await client.send(new DeleteSecretCommand({
      SecretId: secretName,
      ForceDeleteWithoutRecovery: false, // 7-day recovery window
    }));

    return NextResponse.json({ success: true, deleted: secretName });
  } catch (error: any) {
    console.error("AWS delete secret error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
