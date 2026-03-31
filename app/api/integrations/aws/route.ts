import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt, decrypt } from "@/lib/encription";
import {
  SecretsManagerClient,
  ListSecretsCommand,
} from "@aws-sdk/client-secrets-manager";

interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

async function getAwsCredentials(userId: string): Promise<AwsCredentials | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "aws" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const encrypted = JSON.parse(integration.accessToken);
    const raw = decrypt(encrypted);
    return JSON.parse(raw) as AwsCredentials;
  } catch {
    return null;
  }
}

// GET /api/integrations/aws — check connection status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "aws" } },
      select: { username: true, config: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });

    return NextResponse.json({
      connected: true,
      username: integration.username,
      region: (integration.config as any)?.region || "us-east-1",
      connectedAt: integration.createdAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/aws — save IAM credentials
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { accessKeyId, secretAccessKey, region } = await req.json();
    if (!accessKeyId || !secretAccessKey || !region) {
      return NextResponse.json(
        { error: "accessKeyId, secretAccessKey, and region are required" },
        { status: 400 }
      );
    }

    // Validate credentials by calling ListSecrets
    const client = new SecretsManagerClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    try {
      await client.send(new ListSecretsCommand({ MaxResults: 1 }));
    } catch (awsErr: any) {
      const msg = awsErr?.message || "Invalid AWS credentials";
      return NextResponse.json(
        { error: `AWS validation failed: ${msg}` },
        { status: 400 }
      );
    }

    // Encrypt all credentials together
    const credsJson = JSON.stringify({ accessKeyId, secretAccessKey, region });
    const encrypted = encrypt(credsJson);

    await prisma.integration.upsert({
      where: { userId_provider: { userId: auth.userId, provider: "aws" } },
      create: {
        userId: auth.userId,
        provider: "aws",
        accessToken: JSON.stringify(encrypted),
        username: accessKeyId, // display the key ID as the "username"
        config: { region } as any,
        enabled: true,
        status: "connected",
      },
      update: {
        accessToken: JSON.stringify(encrypted),
        username: accessKeyId,
        config: { region } as any,
        status: "connected",
        enabled: true,
      },
    });

    return NextResponse.json({ connected: true, username: accessKeyId, region });
  } catch (error: any) {
    console.error("AWS POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/aws — disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "aws" },
    });

    return NextResponse.json({ success: true, message: "AWS disconnected" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
