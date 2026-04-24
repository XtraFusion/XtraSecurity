import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import { JWT } from "google-auth-library";
import axios from "axios";

async function getFirebaseCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "firebase" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const saStr = decrypt(JSON.parse(integration.accessToken));
    return JSON.parse(saStr);
  } catch { return null; }
}

// GET /api/integrations/firebase/sync - List regions (as targets)
export async function GET(req: NextRequest) {
  const regions = ["us-central1", "europe-west1", "asia-northeast1", "us-east1"].map(r => ({
    id: r, name: r, fullName: r, owner: "Firebase Region", private: true, url: "#"
  }));
  return NextResponse.json({ repos: regions });
}

// POST /api/integrations/firebase/sync - Sync to Firebase Secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json(); // targetId is region
    const sa = await getFirebaseCreds(auth.userId);
    if (!sa) return NextResponse.json({ error: "Firebase not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found" }, { status: 404 });

    const client = new JWT({ email: sa.client_email, key: sa.private_key, scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    const { token } = await client.getAccessToken();
    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    
    const results: any[] = [];
    let synced = 0;

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const name = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
        const secretId = name.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

        const secretUrl = `https://secretmanager.googleapis.com/v1/projects/${sa.project_id}/secrets/${secretId}`;
        
        // Create if doesn't exist
        await axios.get(secretUrl, { headers }).catch(async (e) => {
          if (e.response?.status === 404) {
            await axios.post(`https://secretmanager.googleapis.com/v1/projects/${sa.project_id}/secrets`, {
              replication: { automatic: {} }
            }, { headers, params: { secretId } });
          }
        });

        // Add version
        await axios.post(`${secretUrl}:addVersion`, {
          payload: { data: Buffer.from(decryptedValue).toString("base64") }
        }, { headers });

        results.push({ key: secretId, success: true });
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
