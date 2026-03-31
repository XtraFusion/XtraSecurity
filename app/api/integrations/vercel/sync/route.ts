import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";


// Helper — get decrypted Vercel token for current user
async function getVercelToken(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "vercel" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const encryptedToken = JSON.parse(integration.accessToken);
    return decrypt(encryptedToken);
  } catch {
    return null;
  }
}

// GET /api/integrations/vercel/sync — list Vercel projects
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getVercelToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Vercel not connected" }, { status: 400 });

    // Fetch Vercel projects — paginated, up to 100
    const res = await fetch("https://api.vercel.com/v9/projects?limit=100", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || "Failed to fetch Vercel projects" },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      repos: (data.projects || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        fullName: p.name,
        owner: p.accountId,
        private: true, // Vercel projects are always "private" in our context
        url: `https://vercel.com/${p.name}`,
        framework: p.framework || null,
      })),
    });
  } catch (error: any) {
    console.error("Vercel list projects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/vercel/sync — sync secrets to a Vercel project
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, vercelProjectId, secretPrefix } = await req.json();

    if (!projectId || !environment || !vercelProjectId) {
      return NextResponse.json(
        { error: "projectId, environment, and vercelProjectId are required" },
        { status: 400 }
      );
    }

    const token = await getVercelToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Vercel not connected" }, { status: 400 });

    // Map XtraSecurity environment names → Vercel target values
    const envTargetMap: Record<string, string[]> = {
      development: ["development"],
      staging: ["preview"],
      production: ["production"],
    };
    const vercelTargets = envTargetMap[environment.toLowerCase()] ?? ["production"];

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: auth.userId },
          {
            teamProjects: {
              some: {
                team: { members: { some: { userId: auth.userId, status: "active" } } },
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
    }

    // Fetch secrets for the environment
    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const secrets = allSecrets.filter(
      (s) => s.environmentType?.toLowerCase() === environment.toLowerCase()
    );

    if (secrets.length === 0) {
      const availableEnvs = [...new Set(allSecrets.map((s) => s.environmentType).filter(Boolean))];
      return NextResponse.json(
        {
          error: `No secrets found for environment "${environment}". Available: ${
            availableEnvs.length > 0 ? availableEnvs.join(", ") : "none"
          }`,
        },
        { status: 404 }
      );
    }

    // First — fetch existing env vars so we know what to create vs update
    const existingRes = await fetch(
      `https://api.vercel.com/v9/projects/${vercelProjectId}/env?decrypt=false`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let existingVars: { id: string; key: string; target: string[] }[] = [];
    if (existingRes.ok) {
      const existingData = await existingRes.json();
      existingVars = existingData.envs || [];
    }

    const syncResults: { key: string; success: boolean; error?: string }[] = [];

    for (const secret of secrets) {
      try {
        // Decrypt value
        let decryptedValue: string;
        try {
          const rawValue = Array.isArray(secret.value) ? secret.value[0] : secret.value;
          const encryptedValue =
            typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
          decryptedValue = decrypt(encryptedValue);
        } catch (decryptErr: any) {

          syncResults.push({
            key: secret.key,
            success: false,
            error: `Decryption failed: ${decryptErr.message}`,
          });
          continue;
        }

        const secretName = secretPrefix
          ? `${secretPrefix}_${secret.key}`.toUpperCase()
          : secret.key.toUpperCase();

        // Check if this env var already exists for these targets
        const existing = existingVars.find(
          (v) =>
            v.key === secretName &&
            vercelTargets.some((t) => v.target.includes(t))
        );

        let syncRes: Response;

        if (existing) {
          // PATCH — update existing
          syncRes = await fetch(
            `https://api.vercel.com/v9/projects/${vercelProjectId}/env/${existing.id}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                value: decryptedValue,
                target: vercelTargets,
                type: "encrypted",
              }),
            }
          );
        } else {
          // POST — create new
          syncRes = await fetch(
            `https://api.vercel.com/v9/projects/${vercelProjectId}/env`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                key: secretName,
                value: decryptedValue,
                target: vercelTargets,
                type: "encrypted",
              }),
            }
          );
        }

        if (syncRes.ok) {
          syncResults.push({ key: secretName, success: true });
        } else {
          const errData = await syncRes.json().catch(() => ({}));
          const errMsg =
            errData?.error?.message || errData?.message || `HTTP ${syncRes.status}`;
          syncResults.push({ key: secretName, success: false, error: errMsg });
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
          action: "vercel_sync",
          entity: "project",
          entityId: projectId,
          changes: {
            vercelProjectId,
            environment,
            secretsCount: secrets.length,
            successCount: syncResults.filter((r) => r.success).length,
          },
        },
      });
    } catch (auditErr) {
      console.error("Audit log failed:", auditErr);
    }

    return NextResponse.json({
      success: true,
      repo: vercelProjectId,
      results: syncResults,
      summary: {
        total: syncResults.length,
        synced: syncResults.filter((r) => r.success).length,
        failed: syncResults.filter((r) => !r.success).length,
      },
    });
  } catch (error: any) {
    console.error("Vercel sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/vercel/sync?vercelProjectId=&envId= — remove a single env var
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const vercelProjectId = url.searchParams.get("vercelProjectId");
    const envId = url.searchParams.get("envId");
    const secretName = url.searchParams.get("secretName");

    if (!vercelProjectId || (!envId && !secretName)) {
      return NextResponse.json(
        { error: "vercelProjectId and either envId or secretName are required" },
        { status: 400 }
      );
    }

    const token = await getVercelToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Vercel not connected" }, { status: 400 });

    let targetEnvId = envId;

    // If no envId, resolve by secretName
    if (!targetEnvId && secretName) {
      const listRes = await fetch(
        `https://api.vercel.com/v9/projects/${vercelProjectId}/env`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (listRes.ok) {
        const listData = await listRes.json();
        const found = (listData.envs || []).find((v: any) => v.key === secretName);
        if (found) targetEnvId = found.id;
      }
    }

    if (!targetEnvId) {
      return NextResponse.json({ error: "Env var not found in Vercel project" }, { status: 404 });
    }

    const deleteRes = await fetch(
      `https://api.vercel.com/v9/projects/${vercelProjectId}/env/${targetEnvId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (deleteRes.ok || deleteRes.status === 204) {
      return NextResponse.json({ success: true, deleted: secretName || targetEnvId });
    }

    const err = await deleteRes.json().catch(() => ({ message: deleteRes.statusText }));
    return NextResponse.json(
      { error: err?.error?.message || "Failed to delete env var" },
      { status: deleteRes.status }
    );
  } catch (error: any) {
    console.error("Vercel delete env var error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
