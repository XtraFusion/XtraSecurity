import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import { notify } from "@/lib/notifier";

// Netlify env context mapping
// XtraSecurity env  →  Netlify context
const CONTEXT_MAP: Record<string, string> = {
  development: "dev",
  staging: "branch-deploy",
  production: "production",
};

// Helper — fetch stored token + accountId for user
async function getNetlifyCredentials(
  userId: string
): Promise<{ token: string; accountId: string | null } | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "netlify" } },
  });
  if (!integration?.accessToken) return null;

  try {
    const encryptedToken = JSON.parse(integration.accessToken);
    const token = decrypt(encryptedToken);
    const accountId = (integration.config as any)?.accountId || null;
    return { token, accountId };
  } catch {
    return null;
  }
}

// GET /api/integrations/netlify/sync — list Netlify sites
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getNetlifyCredentials(auth.userId);
    if (!creds) return NextResponse.json({ error: "Netlify not connected" }, { status: 400 });

    const res = await fetch("https://api.netlify.com/api/v1/sites?per_page=100", {
      headers: { Authorization: `Bearer ${creds.token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.message || "Failed to fetch Netlify sites" },
        { status: res.status }
      );
    }

    const sites: any[] = await res.json();

    return NextResponse.json({
      repos: sites.map((s) => ({
        id: s.id,
        name: s.name,
        fullName: s.name,
        owner: s.account_slug || s.account_name || "",
        private: !s.published_deploy?.ssl_url,
        url: s.ssl_url || s.url || "",
        framework: s.framework || null,
        accountId: s.account_id,
      })),
    });
  } catch (error: any) {
    console.error("Netlify list sites error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/netlify/sync — push secrets to a Netlify site
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, netlifySiteId, netlifyAccountId, secretPrefix } =
      await req.json();

    if (!projectId || !environment || !netlifySiteId) {
      return NextResponse.json(
        { error: "projectId, environment, and netlifySiteId are required" },
        { status: 400 }
      );
    }

    const creds = await getNetlifyCredentials(auth.userId);
    if (!creds) return NextResponse.json({ error: "Netlify not connected" }, { status: 400 });

    const netlifyContext = CONTEXT_MAP[environment.toLowerCase()] ?? "production";
    // Prefer the accountId passed from the client (per-site) over stored global one
    const accountId = netlifyAccountId || creds.accountId;

    if (!accountId) {
      return NextResponse.json(
        { error: "Could not determine Netlify Account ID. Please reconnect Netlify." },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: auth.userId },
          {
            teamProjects: {
              some: {
                team: {
                  members: { some: { userId: auth.userId, status: "active" } },
                },
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 403 }
      );
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
      const availableEnvs = [
        ...new Set(allSecrets.map((s) => s.environmentType).filter(Boolean)),
      ];
      return NextResponse.json(
        {
          error: `No secrets found for environment "${environment}". Available: ${
            availableEnvs.length > 0 ? availableEnvs.join(", ") : "none"
          }`,
        },
        { status: 404 }
      );
    }

    // Fetch existing env vars for this site (to know create vs update)
    const existingRes = await fetch(
      `https://api.netlify.com/api/v1/accounts/${accountId}/env?site_id=${netlifySiteId}&context_name=${netlifyContext}`,
      { headers: { Authorization: `Bearer ${creds.token}` } }
    );

    const existingKeys = new Set<string>();
    if (existingRes.ok) {
      const existingVars: any[] = await existingRes.json();
      existingVars.forEach((v) => existingKeys.add(v.key));
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

        const envPayload = {
          values: [{ value: decryptedValue, context: netlifyContext }],
        };

        let syncRes: Response;
        if (existingKeys.has(secretName)) {
          // PATCH existing key
          syncRes = await fetch(
            `https://api.netlify.com/api/v1/accounts/${accountId}/env/${secretName}?site_id=${netlifySiteId}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${creds.token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(envPayload),
            }
          );
        } else {
          // POST new key
          syncRes = await fetch(
            `https://api.netlify.com/api/v1/accounts/${accountId}/env?site_id=${netlifySiteId}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${creds.token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify([
                {
                  key: secretName,
                  values: [{ value: decryptedValue, context: netlifyContext }],
                  is_secret: true,
                },
              ]),
            }
          );
        }

        if (syncRes.ok) {
          syncResults.push({ key: secretName, success: true });
        } else {
          const errData = await syncRes.json().catch(() => ({}));
          syncResults.push({
            key: secretName,
            success: false,
            error: errData?.message || `HTTP ${syncRes.status}`,
          });
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
          action: "netlify_sync",
          entity: "project",
          entityId: projectId,
          changes: {
            netlifySiteId,
            environment,
            netlifyContext,
            secretsCount: secrets.length,
            successCount: syncResults.filter((r) => r.success).length,
          },
        },
      });
    } catch (auditErr) {
      console.error("Audit log failed:", auditErr);
    }

    // Trigger Unified Notifications (non-blocking)
    notify(
      auth.userId,
      "Netlify Sync Complete",
      `Successfully synced ${syncResults.length} secrets to Netlify site.`,
      `Site: ${netlifySiteId} | Environment: ${environment}`
    ).catch(e => console.error("Notify Error:", e));

    return NextResponse.json({
      success: true,
      repo: netlifySiteId,
      results: syncResults,
      summary: {
        total: syncResults.length,
        synced: syncResults.filter((r) => r.success).length,
        failed: syncResults.filter((r) => !r.success).length,
      },
    });
  } catch (error: any) {
    console.error("Netlify sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/netlify/sync?netlifySiteId=&secretName=&accountId= — remove one env var
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const netlifySiteId = url.searchParams.get("netlifySiteId");
    const secretName = url.searchParams.get("secretName");
    const accountIdParam = url.searchParams.get("accountId");

    if (!netlifySiteId || !secretName) {
      return NextResponse.json(
        { error: "netlifySiteId and secretName are required" },
        { status: 400 }
      );
    }

    const creds = await getNetlifyCredentials(auth.userId);
    if (!creds) return NextResponse.json({ error: "Netlify not connected" }, { status: 400 });

    const accountId = accountIdParam || creds.accountId;
    if (!accountId) {
      return NextResponse.json({ error: "Could not determine Account ID" }, { status: 400 });
    }

    const deleteRes = await fetch(
      `https://api.netlify.com/api/v1/accounts/${accountId}/env/${secretName}?site_id=${netlifySiteId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${creds.token}` },
      }
    );

    if (deleteRes.ok || deleteRes.status === 204) {
      // Trigger Unified Notifications (non-blocking)
      notify(
        auth.userId,
        "Secret Deleted from Netlify",
        `Removed '${secretName}' from Netlify site.`,
        `Site: ${netlifySiteId}`
      ).catch(e => console.error("Notify Error:", e));

      return NextResponse.json({ success: true, deleted: secretName });
    }

    const err = await deleteRes.json().catch(() => ({ message: deleteRes.statusText }));
    return NextResponse.json(
      { error: err?.message || "Failed to delete env var" },
      { status: deleteRes.status }
    );
  } catch (error: any) {
    console.error("Netlify delete env var error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
