import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getJenkinsCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "jenkins" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, jenkinsUrl: cfg?.jenkinsUrl as string, username: cfg?.username as string };
  } catch { return null; }
}

// GET /api/integrations/jenkins/sync - List pipelines/jobs
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getJenkinsCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Jenkins not connected" }, { status: 400 });

    const res = await axios.get(`${creds.jenkinsUrl}/api/json?tree=jobs[name,url,color]`, {
      auth: { username: creds.username, password: creds.token },
      timeout: 8000,
    });

    const repos = (res.data?.jobs || []).map((job: any) => ({
      id: job.name,
      name: job.name,
      fullName: job.name,
      owner: "jenkins",
      private: true,
      url: job.url,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/jenkins/sync - Inject secrets into Jenkins credentials store
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json();
    if (!projectId || !environment) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const creds = await getJenkinsCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Jenkins not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });

    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
        const credId = rawKey.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

        // Jenkins Credentials API - create/update secret text in global domain
        const credentialXml = `<org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>${credId}</id>
  <description>XtraSecurity: ${rawKey} (${environment})</description>
  <secret>${decryptedValue}</secret>
</org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>`;

        // Try update first, then create
        try {
          await axios.post(
            `${creds.jenkinsUrl}/credentials/store/system/domain/_/credential/${credId}/config.xml`,
            credentialXml,
            { auth: { username: creds.username, password: creds.token }, headers: { "Content-Type": "application/xml" }, timeout: 8000 }
          );
        } catch {
          await axios.post(
            `${creds.jenkinsUrl}/credentials/store/system/domain/_/createCredentials`,
            `json={"": "0", "credentials": {"scope": "GLOBAL", "id": "${credId}", "secret": "${decryptedValue}", "description": "XtraSecurity: ${rawKey}", "$class": "org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl"}}`,
            { auth: { username: creds.username, password: creds.token }, headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 8000 }
          );
        }

        results.push({ key: credId, success: true });
        syncedCount++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.message });
      }
    }

    return NextResponse.json({ success: true, summary: { total: results.length, synced: syncedCount, failed: results.length - syncedCount }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/jenkins/sync - Delete credential
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const secretName = url.searchParams.get("secretName");
    if (!secretName) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const creds = await getJenkinsCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Jenkins not connected" }, { status: 400 });

    await axios.post(
      `${creds.jenkinsUrl}/credentials/store/system/domain/_/credential/${secretName}/doDelete`,
      null,
      { auth: { username: creds.username, password: creds.token }, timeout: 8000 }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
