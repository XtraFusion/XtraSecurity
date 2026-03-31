import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";

async function getBitbucketCredentials(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "bitbucket" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const appPassword = decrypt(JSON.parse(integration.accessToken));
    const credentials = Buffer.from(`${integration.username}:${appPassword}`).toString("base64");
    return { credentials, username: integration.username };
  } catch {
    return null;
  }
}

// GET /api/integrations/bitbucket/sync - List repositories
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getBitbucketCredentials(auth.userId);
    if (!creds) return NextResponse.json({ error: "Bitbucket not connected" }, { status: 400 });

    // Fetch repositories
    // Bitbucket API v2: GET /repositories returns repos the user has access to
    const res = await fetch("https://api.bitbucket.org/2.0/repositories?role=member&pagelen=100", {
      headers: { Authorization: `Basic ${creds.credentials}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 });
    }

    const data = await res.json();
    const repos = (data.values || []).map((repo: any) => ({
      id: repo.full_name,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.nickname || repo.owner.username || repo.owner.display_name,
      private: repo.is_private,
      url: repo.links.html.href,
      workspace: repo.workspace.slug,
      slug: repo.slug,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/bitbucket/sync - Push secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, repoFullName, secretPrefix } = await req.json();
    if (!projectId || !environment || !repoFullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const creds = await getBitbucketCredentials(auth.userId);
    if (!creds) return NextResponse.json({ error: "Bitbucket not connected" }, { status: 400 });

    // Fetch secrets
    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) {
      return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });
    }

    // Fetch existing variables in Bitbucket to handle updates
    const varsRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${repoFullName}/pipelines_config/variables/?pagelen=100`, {
      headers: { Authorization: `Basic ${creds.credentials}` },
    });
    
    let existingVars: any[] = [];
    if (varsRes.ok) {
      const varsData = await varsRes.json();
      existingVars = varsData.values || [];
    }

    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;

    for (const secret of envSecrets) {
      try {
        const key = secretPrefix ? `${secretPrefix}_${secret.key}`.toUpperCase() : secret.key.toUpperCase();
        
        // Decrypt secret value
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);

        // Check if variable exists
        const existing = existingVars.find(v => v.key === key);
        
        let bbRes: Response;
        if (existing) {
          // UPDATE (PUT)
          bbRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${repoFullName}/pipelines_config/variables/${existing.uuid}`, {
            method: "PUT",
            headers: {
              Authorization: `Basic ${creds.credentials}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              key,
              value: decryptedValue,
              secured: true,
            }),
          });
        } else {
          // CREATE (POST)
          bbRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${repoFullName}/pipelines_config/variables/`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${creds.credentials}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              key,
              value: decryptedValue,
              secured: true,
            }),
          });
        }

        if (bbRes.ok) {
          results.push({ key, success: true });
          syncedCount++;
        } else {
          const err = await bbRes.json();
          results.push({ key, success: false, error: err.error?.message || "Bitbucket API error" });
        }
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      repo: repoFullName,
      results,
      summary: { total: results.length, synced: syncedCount, failed: results.length - syncedCount },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/bitbucket/sync - Delete variable
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const repoFullName = url.searchParams.get("repoFullName");
    const secretName = url.searchParams.get("secretName")?.toUpperCase();

    if (!repoFullName || !secretName) {
      return NextResponse.json({ error: "repoFullName and secretName are required" }, { status: 400 });
    }

    const creds = await getBitbucketCredentials(auth.userId);
    if (!creds) return NextResponse.json({ error: "Bitbucket not connected" }, { status: 400 });

    // Must find the UUID first
    const varsRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${repoFullName}/pipelines_config/variables/?pagelen=100`, {
      headers: { Authorization: `Basic ${creds.credentials}` },
    });
    
    if (!varsRes.ok) return NextResponse.json({ error: "Failed to fetch variables" }, { status: 500 });
    
    const varsData = await varsRes.json();
    const variable = (varsData.values || []).find((v: any) => v.key === secretName);

    if (!variable) {
      return NextResponse.json({ error: "Variable not found in Bitbucket" }, { status: 404 });
    }

    const delRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${repoFullName}/pipelines_config/variables/${variable.uuid}`, {
      method: "DELETE",
      headers: { Authorization: `Basic ${creds.credentials}` },
    });

    if (!delRes.ok) return NextResponse.json({ error: "Failed to delete variable" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
