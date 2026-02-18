import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";

// POST /api/integrations/github/sync - Sync secrets to GitHub repo
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, environment, repoOwner, repoName, secretPrefix } = await req.json();

    if (!projectId || !environment || !repoOwner || !repoName) {
      return NextResponse.json({ 
        error: "projectId, environment, repoOwner, and repoName are required" 
      }, { status: 400 });
    }

    // Get GitHub integration
    const integration = await prisma.integration.findUnique({
      where: {
        userId_provider: {
          userId: auth.userId,
          provider: "github"
        }
      }
    });

    if (!integration) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
    }

    // Decrypt access token
    const encryptedToken = JSON.parse(integration.accessToken!);
    const accessToken = decrypt(encryptedToken);

    // Verify project belongs to user (separate check, no relation filter)
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: auth.userId },
          { teamProjects: { some: { team: { members: { some: { userId: auth.userId, status: "active" } } } } } }
        ]
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
    }

    // Get secrets for the project — match environment case-insensitively
    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true }
    });

    // Filter by environment (case-insensitive)
    const secrets = allSecrets.filter(
      s => s.environmentType?.toLowerCase() === environment.toLowerCase()
    );

    if (secrets.length === 0) {
      // Return helpful error showing what environments DO have secrets
      const availableEnvs = [...new Set(allSecrets.map(s => s.environmentType).filter(Boolean))];
      return NextResponse.json({ 
        error: `No secrets found for environment "${environment}". Available environments: ${availableEnvs.length > 0 ? availableEnvs.join(", ") : "none"}` 
      }, { status: 404 });
    }

    // Get repo public key for encryption
    const keyRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/actions/secrets/public-key`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/vnd.github.v3+json"
        }
      }
    );

    if (!keyRes.ok) {
      const error = await keyRes.json();
      return NextResponse.json({ 
        error: `GitHub API error: ${error.message || keyRes.statusText}` 
      }, { status: keyRes.status });
    }

    const { key, key_id } = await keyRes.json();

    // Use tweetnacl-sealedbox-js for sealed box encryption (Node-friendly)
    const { seal } = await import("tweetnacl-sealedbox-js");

    const syncResults: { key: string; success: boolean; error?: string }[] = [];

    // Sync each secret
    for (const secret of secrets) {
      try {
        // Decrypt secret value — handle both string and array formats
        let decryptedValue: string;
        try {
          const rawValue = Array.isArray(secret.value) ? secret.value[0] : secret.value;
          const encryptedValue = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
          decryptedValue = decrypt(encryptedValue);
        } catch (decryptErr: any) {
          syncResults.push({ key: secret.key, success: false, error: `Decryption failed: ${decryptErr.message}` });
          continue;
        }

        // Encrypt for GitHub using sealed box
        const messageBytes = Uint8Array.from(Buffer.from(decryptedValue, "utf-8"));
        const keyBytes = Uint8Array.from(Buffer.from(key, "base64"));
        const encryptedBytes = seal(messageBytes, keyBytes);
        const encryptedBase64 = Buffer.from(encryptedBytes).toString("base64");

        const secretName = secretPrefix 
          ? `${secretPrefix}_${secret.key}`.toUpperCase()
          : secret.key.toUpperCase();

        // Create/update secret in GitHub
        const syncRes = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/actions/secrets/${secretName}`,
          {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Accept": "application/vnd.github.v3+json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              encrypted_value: encryptedBase64,
              key_id
            })
          }
        );

        if (syncRes.ok || syncRes.status === 201 || syncRes.status === 204) {
          syncResults.push({ key: secretName, success: true });
        } else {
          const error = await syncRes.json();
          syncResults.push({ key: secretName, success: false, error: error.message || `HTTP ${syncRes.status}` });
        }
      } catch (err: any) {
        syncResults.push({ key: secret.key, success: false, error: err.message });
      }
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: "github_sync",
          entity: "project",
          entityId: projectId,
          changes: { 
            repo: `${repoOwner}/${repoName}`, 
            environment,
            secretsCount: secrets.length,
            successCount: syncResults.filter(r => r.success).length
          }
        }
      });
    } catch (auditErr) {
      // Don't fail the sync if audit log fails
      console.error("Audit log failed:", auditErr);
    }

    return NextResponse.json({
      success: true,
      repo: `${repoOwner}/${repoName}`,
      results: syncResults,
      summary: {
        total: syncResults.length,
        synced: syncResults.filter(r => r.success).length,
        failed: syncResults.filter(r => !r.success).length
      }
    });

  } catch (error: any) {
    console.error("GitHub sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/integrations/github/sync - List repos
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get GitHub integration
    const integration = await prisma.integration.findUnique({
      where: {
        userId_provider: {
          userId: auth.userId,
          provider: "github"
        }
      }
    });

    if (!integration) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
    }

    // Decrypt access token
    const encryptedToken = JSON.parse(integration.accessToken);
    const accessToken = decrypt(encryptedToken);

    // Get repos
    const reposRes = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (!reposRes.ok) {
      return NextResponse.json({ error: "Failed to fetch repos" }, { status: 500 });
    }

    const repos = await reposRes.json();

    return NextResponse.json({
      repos: repos.map((r: any) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        owner: r.owner.login,
        private: r.private,
        url: r.html_url
      }))
    });

  } catch (error: any) {
    console.error("GitHub repos error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/github/sync?repoOwner=&repoName=&secretName= - Delete a secret from GitHub
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const repoOwner = url.searchParams.get("repoOwner");
    const repoName = url.searchParams.get("repoName");
    const secretName = url.searchParams.get("secretName");

    if (!repoOwner || !repoName || !secretName) {
      return NextResponse.json({ error: "repoOwner, repoName, and secretName are required" }, { status: 400 });
    }

    // Get GitHub integration
    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "github" } }
    });

    if (!integration) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
    }

    const encryptedToken = JSON.parse(integration.accessToken);
    const accessToken = decrypt(encryptedToken);

    const deleteRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/actions/secrets/${secretName}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/vnd.github.v3+json"
        }
      }
    );

    if (deleteRes.status === 204 || deleteRes.ok) {
      return NextResponse.json({ success: true, deleted: secretName });
    }

    const error = await deleteRes.json().catch(() => ({ message: deleteRes.statusText }));
    return NextResponse.json({ error: error.message || "Failed to delete secret" }, { status: deleteRes.status });

  } catch (error: any) {
    console.error("GitHub delete secret error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

