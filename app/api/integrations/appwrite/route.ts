import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/appwrite - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "appwrite" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, endpoint: cfg?.endpoint, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/appwrite - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { endpoint, project, apiKey } = await req.json();
    if (!endpoint || !project || !apiKey) return NextResponse.json({ error: "Endpoint, Project ID, and API Key are required" }, { status: 400 });

    const headers = { 
      "X-Appwrite-Project": project,
      "X-Appwrite-Key": apiKey,
      "Content-Type": "application/json"
    };

    try {
      // Validate by fetching project details
      const res = await axios.get(`${endpoint}/projects/${project}`, { headers, timeout: 8000 });
      const username = res.data?.name || project;
      const encrypted = encrypt(apiKey);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "appwrite" } },
        create: { userId: auth.userId, provider: "appwrite", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { endpoint, project } },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true, config: { endpoint, project } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      console.error("Appwrite Connect Error:", e.response?.data || e.message);
      return NextResponse.json({ error: "Appwrite connection failed. Check your credentials." }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/appwrite
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "appwrite" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
