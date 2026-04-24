import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import { JWT } from "google-auth-library";

// GET /api/integrations/firebase - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "firebase" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, projectId: cfg?.projectId, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/firebase - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { serviceAccount } = await req.json();
    if (!serviceAccount) return NextResponse.json({ error: "Service Account JSON is required" }, { status: 400 });

    let sa;
    try {
      sa = JSON.parse(serviceAccount);
    } catch {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    const client = new JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    try {
      await client.authorize();
      const username = sa.project_id;
      const encrypted = encrypt(serviceAccount);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "firebase" } },
        create: { userId: auth.userId, provider: "firebase", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { projectId: sa.project_id } },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { projectId: sa.project_id } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "Firebase authentication failed" }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/firebase
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "firebase" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
