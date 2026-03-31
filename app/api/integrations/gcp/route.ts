import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt, decrypt } from "@/lib/encription";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

// GET /api/integrations/gcp - Get status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "gcp" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    
    // Username stores the Project ID for GCP
    return NextResponse.json({
      connected: true,
      projectId: integration.username,
      connectedAt: integration.createdAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/gcp - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { serviceAccountJson } = await req.json();
    if (!serviceAccountJson) {
      return NextResponse.json({ error: "Service Account JSON is required" }, { status: 400 });
    }

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
      return NextResponse.json({ error: "Incomplete Service Account JSON (missing project_id, private_key, or client_email)" }, { status: 400 });
    }

    // Validate with Secret Manager Client
    try {
      const client = new SecretManagerServiceClient({ credentials });
      // Just test a list call with a tiny page size to verify access
      await client.listSecrets({ parent: `projects/${credentials.project_id}`, pageSize: 1 });
    } catch (e: any) {
      return NextResponse.json({ error: `GCP Authentication failed: ${e.message}` }, { status: 401 });
    }

    const encrypted = encrypt(serviceAccountJson);

    await prisma.integration.upsert({
      where: { userId_provider: { userId: auth.userId, provider: "gcp" } },
      create: {
        userId: auth.userId,
        provider: "gcp",
        accessToken: JSON.stringify(encrypted),
        username: credentials.project_id, // Store Project ID as identifier
        status: "connected",
        enabled: true,
      },
      update: {
        accessToken: JSON.stringify(encrypted),
        username: credentials.project_id,
        status: "connected",
        enabled: true,
      },
    });

    return NextResponse.json({ connected: true, projectId: credentials.project_id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/gcp - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "gcp" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
