import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";

// POST /api/integrations/gitlab/sync - Sync secrets to GitLab project CI/CD variables
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, environment, gitlabProjectId, secretPrefix } = await req.json();

    if (!projectId || !environment || !gitlabProjectId) {
      return NextResponse.json({
        error: "projectId, environment, and gitlabProjectId are required"
      }, { status: 400 });
    }

    // Get GitLab integration
    const integration = await prisma.integration.findUnique({
      where: {
        userId_provider: {
          userId: auth.userId,
          provider: "gitlab"
        }
      }
    });

    if (!integration) {
      return NextResponse.json({ error: "GitLab not connected" }, { status: 400 });
    }

    // Decrypt access token
    const encryptedToken = JSON.parse(integration.accessToken!);
    const accessToken = decrypt(encryptedToken);

    // Verify project belongs to user
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

    // Get secrets for the project
    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true }
    });

    const secrets = allSecrets.filter(
      s => s.environmentType?.toLowerCase() === environment.toLowerCase()
    );

    if (secrets.length === 0) {
      const availableEnvs = [...new Set(allSecrets.map(s => s.environmentType).filter(Boolean))];
      return NextResponse.json({
        error: `No secrets found for environment "${environment}". Available environments: ${availableEnvs.length > 0 ? availableEnvs.join(", ") : "none"}`
      }, { status: 404 });
    }

    // Get GitLab project info for the repo name
    const gitlabProjectRes = await fetch(
      `https://gitlab.com/api/v4/projects/${gitlabProjectId}`,
      {
        headers: { "Authorization": `Bearer ${accessToken}` }
      }
    );

    if (!gitlabProjectRes.ok) {
      return NextResponse.json({ error: "Failed to fetch GitLab project info" }, { status: 500 });
    }

    const gitlabProject = await gitlabProjectRes.json();

    const syncResults: { key: string; success: boolean; error?: string }[] = [];

    // Sync each secret as a CI/CD variable
    for (const secret of secrets) {
      try {
        // Decrypt secret value
        let decryptedValue: string;
        try {
          const rawValue = Array.isArray(secret.value) ? secret.value[0] : secret.value;
          const encryptedValue = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
          decryptedValue = decrypt(encryptedValue);
        } catch (decryptErr: any) {
          syncResults.push({ key: secret.key, success: false, error: `Decryption failed: ${decryptErr.message}` });
          continue;
        }

        const varKey = secretPrefix
          ? `${secretPrefix}_${secret.key}`.toUpperCase()
          : secret.key.toUpperCase();

        // Try to update first, if 404 then create
        const updateRes = await fetch(
          `https://gitlab.com/api/v4/projects/${gitlabProjectId}/variables/${varKey}`,
          {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              value: decryptedValue,
              protected: false,
              masked: true,
              raw: true
            })
          }
        );

        if (updateRes.ok) {
          syncResults.push({ key: varKey, success: true });
          continue;
        }

        // Variable doesn't exist, create it
        if (updateRes.status === 404) {
          const createRes = await fetch(
            `https://gitlab.com/api/v4/projects/${gitlabProjectId}/variables`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                key: varKey,
                value: decryptedValue,
                protected: false,
                masked: false,
                raw: true
              })
            }
          );

          if (createRes.ok || createRes.status === 201) {
            syncResults.push({ key: varKey, success: true });
          } else {
            const error = await createRes.json().catch(() => ({ message: createRes.statusText }));
            syncResults.push({ key: varKey, success: false, error: error.message || `HTTP ${createRes.status}` });
          }
        } else {
          const error = await updateRes.json().catch(() => ({ message: updateRes.statusText }));
          syncResults.push({ key: varKey, success: false, error: error.message || `HTTP ${updateRes.status}` });
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
          action: "gitlab_sync",
          entity: "project",
          entityId: projectId,
          changes: {
            repo: gitlabProject.path_with_namespace,
            environment,
            secretsCount: secrets.length,
            successCount: syncResults.filter(r => r.success).length
          }
        }
      });
    } catch (auditErr) {
      console.error("Audit log failed:", auditErr);
    }

    return NextResponse.json({
      success: true,
      repo: gitlabProject.path_with_namespace,
      results: syncResults,
      summary: {
        total: syncResults.length,
        synced: syncResults.filter(r => r.success).length,
        failed: syncResults.filter(r => !r.success).length
      }
    });

  } catch (error: any) {
    console.error("GitLab sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/integrations/gitlab/sync - List GitLab projects
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integration = await prisma.integration.findUnique({
      where: {
        userId_provider: {
          userId: auth.userId,
          provider: "gitlab"
        }
      }
    });

    if (!integration) {
      return NextResponse.json({ error: "GitLab not connected" }, { status: 400 });
    }

    const encryptedToken = JSON.parse(integration.accessToken!);
    const accessToken = decrypt(encryptedToken);

    // Fetch user's projects
    const projectsRes = await fetch(
      "https://gitlab.com/api/v4/projects?membership=true&per_page=100&order_by=last_activity_at",
      {
        headers: { "Authorization": `Bearer ${accessToken}` }
      }
    );

    if (!projectsRes.ok) {
      return NextResponse.json({ error: "Failed to fetch GitLab projects" }, { status: 500 });
    }

    const projects = await projectsRes.json();

    return NextResponse.json({
      repos: projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        fullName: p.path_with_namespace,
        owner: p.namespace?.name || p.path_with_namespace.split("/")[0],
        private: p.visibility === "private",
        url: p.web_url
      }))
    });

  } catch (error: any) {
    console.error("GitLab projects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/gitlab/sync - Delete a variable from GitLab
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const gitlabProjectId = url.searchParams.get("gitlabProjectId");
    const variableKey = url.searchParams.get("variableKey");

    if (!gitlabProjectId || !variableKey) {
      return NextResponse.json({ error: "gitlabProjectId and variableKey are required" }, { status: 400 });
    }

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "gitlab" } }
    });

    if (!integration) {
      return NextResponse.json({ error: "GitLab not connected" }, { status: 400 });
    }

    const encryptedToken = JSON.parse(integration.accessToken!);
    const accessToken = decrypt(encryptedToken);

    const deleteRes = await fetch(
      `https://gitlab.com/api/v4/projects/${gitlabProjectId}/variables/${variableKey}`,
      {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${accessToken}` }
      }
    );

    if (deleteRes.status === 204 || deleteRes.ok) {
      return NextResponse.json({ success: true, deleted: variableKey });
    }

    const error = await deleteRes.json().catch(() => ({ message: deleteRes.statusText }));
    return NextResponse.json({ error: error.message || "Failed to delete variable" }, { status: deleteRes.status });

  } catch (error: any) {
    console.error("GitLab delete variable error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
