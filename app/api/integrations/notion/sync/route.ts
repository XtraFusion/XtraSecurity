import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getNotionCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "notion" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, databaseId: cfg?.databaseId };
  } catch { return null; }
}

// GET /api/integrations/notion/sync - List status
export async function GET(req: NextRequest) {
  const targets = [{ id: "database", name: "Target Database", fullName: "Notion Database", owner: "Registry", private: true, url: "#" }];
  return NextResponse.json({ repos: targets });
}

// POST /api/integrations/notion/sync - Sync to Notion
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment } = await req.json();
    const creds = await getNotionCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Notion not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    const headers = { "Authorization": `Bearer ${creds.token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };
    
    let synced = 0;
    for (const secret of envSecrets) {
      try {
        await axios.post("https://api.notion.com/v1/pages", {
          parent: { database_id: creds.databaseId },
          properties: {
            "Name": { title: [{ text: { content: secret.key } }] },
            "Environment": { select: { name: environment } },
            "Last Updated": { date: { start: new Date().toISOString() } }
          }
        }, { headers });
        synced++;
      } catch {}
    }

    return NextResponse.json({ success: true, synced });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
