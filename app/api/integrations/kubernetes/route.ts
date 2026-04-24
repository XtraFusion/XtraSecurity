import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";
import https from "https";

// GET /api/integrations/kubernetes - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "kubernetes" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, apiServer: cfg?.apiServer, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/kubernetes - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiServer, token, skipTLS } = await req.json();
    if (!apiServer || !token) return NextResponse.json({ error: "API Server URL and Token are required" }, { status: 400 });

    const agent = new https.Agent({ rejectUnauthorized: !skipTLS });

    try {
      // Validate by fetching cluster version or namespaces
      const res = await axios.get(`${apiServer}/api/v1/namespaces`, { 
        headers: { "Authorization": `Bearer ${token}` },
        httpsAgent: agent,
        timeout: 8000 
      });
      
      const username = "K8s Cluster";
      const encryptedToken = encrypt(token);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "kubernetes" } },
        create: { userId: auth.userId, provider: "kubernetes", accessToken: JSON.stringify(encryptedToken), username, status: "connected", enabled: true, config: { apiServer, skipTLS } },
        update: { accessToken: JSON.stringify(encryptedToken), username, status: "connected", enabled: true, config: { apiServer, skipTLS } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      console.error("K8s Connect Error:", e.response?.data || e.message);
      return NextResponse.json({ error: "Kubernetes connection failed. Ensure the API URL and Token are correct." }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/kubernetes
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "kubernetes" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
