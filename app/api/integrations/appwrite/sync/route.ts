import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getAppwriteCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "appwrite" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const apiKey = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { apiKey, endpoint: cfg?.endpoint, project: cfg?.project };
  } catch { return null; }
}

// GET /api/integrations/appwrite/sync - List functions or just the project
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getAppwriteCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Appwrite not connected" }, { status: 400 });

    const headers = { "X-Appwrite-Project": "console", "X-Appwrite-Key": creds.apiKey };
    // Fetch functions
    const funcRes = await axios.get(`${creds.endpoint}/functions`, { headers, params: { id: creds.project }, timeout: 8000 });
    
    const repos = (funcRes.data?.functions || []).map((f: any) => ({
      id: f.$id,
      name: f.name,
      fullName: f.name,
      owner: "Function",
      private: true,
      url: `${creds.endpoint}/functions/${f.$id}`,
    }));

    // Add Project Global context
    repos.unshift({
      id: "global",
      name: "Project Global Variables",
      fullName: "Project Global",
      owner: creds.project,
      private: true,
      url: `${creds.endpoint}/projects/${creds.project}`,
    });

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/appwrite/sync - Push Variables
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json(); // targetId is functionId or 'global'
    const creds = await getAppwriteCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Appwrite not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found" }, { status: 404 });

    const headers = { "X-Appwrite-Project": "console", "X-Appwrite-Key": creds.apiKey, "Content-Type": "application/json" };
    const results: any[] = [];
    let synced = 0;

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const key = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;

        if (targetId === "global") {
          // Sync to project variables (via Appwrite Server API)
          await axios.post(`${creds.endpoint}/projects/${creds.project}/variables`, {
            key, value: decryptedValue
          }, { headers, timeout: 8000 }).catch(async (e) => {
            // Update if exists
            if (e.response?.status === 409) {
               // Need to find variable id first (Appwrite limitation)
            }
          });
        } else {
          // Sync to function variables
          await axios.post(`${creds.endpoint}/functions/${targetId}/variables`, {
            key, value: decryptedValue
          }, { headers, timeout: 8000 }).catch(e => { if (e.response?.status !== 409) throw e; });
        }

        results.push({ key, success: true });
        synced++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false });
      }
    }

    return NextResponse.json({ success: true, summary: { total: results.length, synced, failed: results.length - synced }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
