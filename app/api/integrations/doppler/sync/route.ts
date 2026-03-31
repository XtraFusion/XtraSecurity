import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";

async function getDopplerToken(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "doppler" } },
  });
  if (!integration?.accessToken) return null;
  try { return decrypt(JSON.parse(integration.accessToken)); }
  catch { return null; }
}

// Doppler environment → config name heuristic mapping
const ENV_CONFIG_MAP: Record<string, string[]> = {
  development: ["dev", "development", "local"],
  staging: ["stg", "staging", "stage", "preview"],
  production: ["prd", "prod", "production"],
};

function guessConfig(environment: string, configs: string[]): string | null {
  const candidates = ENV_CONFIG_MAP[environment.toLowerCase()] || [environment.toLowerCase()];
  for (const c of candidates) {
    const match = configs.find((cfg) => cfg.toLowerCase() === c || cfg.toLowerCase().startsWith(c));
    if (match) return match;
  }
  return configs[0] || null;
}

// GET /api/integrations/doppler/sync
// Without query: list all projects+configs as "repos"
// With ?projectId=&environment= : compare XtraSecurity vs Doppler
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const xtraProjectId = url.searchParams.get("projectId");
    const environment = url.searchParams.get("environment");
    const dopplerProject = url.searchParams.get("dopplerProject");
    const dopplerConfig = url.searchParams.get("dopplerConfig");

    const token = await getDopplerToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Doppler not connected" }, { status: 400 });

    // Fetch all Doppler projects
    const projectsRes = await fetch("https://api.doppler.com/v3/projects?per_page=100", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!projectsRes.ok) {
      return NextResponse.json({ error: "Failed to fetch Doppler projects" }, { status: 500 });
    }

    const projectsData = await projectsRes.json();
    const dopplerProjects: { slug: string; name: string }[] = projectsData.projects || [];

    // Fetch configs for each project (parallel, limit to first 10 projects for performance)
    const configPromises = dopplerProjects.slice(0, 10).map(async (proj) => {
      const cfgRes = await fetch(`https://api.doppler.com/v3/configs?project=${proj.slug}&per_page=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!cfgRes.ok) return [];
      const cfgData = await cfgRes.json();
      return (cfgData.configs || []).map((cfg: any) => ({
        id: `${proj.slug}/${cfg.name}`,
        name: cfg.name,
        fullName: `${proj.slug} / ${cfg.name}`,
        owner: proj.name,
        private: true,
        url: `https://dashboard.doppler.com/workplace/projects/${proj.slug}/configs/${cfg.name}`,
        dopplerProject: proj.slug,
        dopplerConfig: cfg.name,
        environment: cfg.root_key || cfg.environment,
      }));
    });

    const configArrays = await Promise.all(configPromises);
    const repos = configArrays.flat();

    // Compare mode
    if (xtraProjectId && environment && dopplerProject && dopplerConfig) {
      const [secretsRes, allXtraSecrets] = await Promise.all([
        fetch(`https://api.doppler.com/v3/configs/config/secrets?project=${dopplerProject}&config=${dopplerConfig}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        prisma.secret.findMany({
          where: { projectId: xtraProjectId },
          select: { key: true, environmentType: true },
        }),
      ]);

      const xtraSecrets = allXtraSecrets.filter(
        (s) => s.environmentType?.toLowerCase() === environment.toLowerCase()
      );

      let dopplerSecrets: Record<string, any> = {};
      if (secretsRes.ok) {
        const sd = await secretsRes.json();
        dopplerSecrets = sd.secrets || {};
      }

      const dopplerKeys = new Set(Object.keys(dopplerSecrets));
      const xtraKeySet = new Set(xtraSecrets.map((s) => s.key.toUpperCase()));

      const items: { key: string; status: "new" | "in_sync" | "only_doppler" }[] = [];

      for (const s of xtraSecrets) {
        const upKey = s.key.toUpperCase();
        items.push({ key: upKey, status: dopplerKeys.has(upKey) ? "in_sync" : "new" });
      }
      for (const dk of dopplerKeys) {
        if (!xtraKeySet.has(dk)) items.push({ key: dk, status: "only_doppler" });
      }

      return NextResponse.json({
        repos,
        compare: {
          items,
          summary: {
            new: items.filter((i) => i.status === "new").length,
            inSync: items.filter((i) => i.status === "in_sync").length,
            onlyDoppler: items.filter((i) => i.status === "only_doppler").length,
          },
        },
      });
    }

    return NextResponse.json({ repos });
  } catch (error: any) {
    console.error("Doppler GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/doppler/sync — push XtraSecurity secrets → Doppler config
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, dopplerProjectSlug, dopplerConfig, secretPrefix } = await req.json();

    if (!projectId || !environment || !dopplerProjectSlug || !dopplerConfig) {
      return NextResponse.json(
        { error: "projectId, environment, dopplerProjectSlug, and dopplerConfig are required" },
        { status: 400 }
      );
    }

    const token = await getDopplerToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Doppler not connected" }, { status: 400 });

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: auth.userId },
          { teamProjects: { some: { team: { members: { some: { userId: auth.userId, status: "active" } } } } } },
        ],
      },
    });

    if (!project) return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const secrets = allSecrets.filter(
      (s) => s.environmentType?.toLowerCase() === environment.toLowerCase()
    );

    if (secrets.length === 0) {
      const available = [...new Set(allSecrets.map((s) => s.environmentType).filter(Boolean))];
      return NextResponse.json(
        { error: `No secrets for "${environment}". Available: ${available.join(", ") || "none"}` },
        { status: 404 }
      );
    }

    // Build secrets payload for Doppler
    const dopplerPayload: Record<string, string> = {};
    const failedDecrypts: { key: string; error: string }[] = [];

    for (const s of secrets) {
      try {
        const { decrypt } = await import("@/lib/encription");
        const rawValue = Array.isArray(s.value) ? s.value[0] : s.value;
        const encryptedValue = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
        const decryptedValue = decrypt(encryptedValue);
        const keyName = secretPrefix
          ? `${secretPrefix}_${s.key}`.toUpperCase()
          : s.key.toUpperCase();
        dopplerPayload[keyName] = decryptedValue;
      } catch (err: any) {
        failedDecrypts.push({ key: s.key, error: err.message });
      }
    }

    // Push to Doppler — single batch request
    const dopplerRes = await fetch("https://api.doppler.com/v3/configs/config/secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: dopplerProjectSlug,
        config: dopplerConfig,
        secrets: dopplerPayload,
      }),
    });

    if (!dopplerRes.ok) {
      const err = await dopplerRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.messages?.[0] || "Failed to push secrets to Doppler" },
        { status: dopplerRes.status }
      );
    }

    const successKeys = Object.keys(dopplerPayload);
    const results = [
      ...successKeys.map((k) => ({ key: k, success: true })),
      ...failedDecrypts.map((f) => ({ key: f.key, success: false, error: f.error })),
    ];

    try {
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: "doppler_sync",
          entity: "project",
          entityId: projectId,
          changes: {
            environment,
            dopplerProject: dopplerProjectSlug,
            dopplerConfig,
            secretsCount: secrets.length,
            successCount: successKeys.length,
          },
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      repo: `${dopplerProjectSlug}/${dopplerConfig}`,
      results,
      summary: {
        total: results.length,
        synced: successKeys.length,
        failed: failedDecrypts.length,
      },
    });
  } catch (error: any) {
    console.error("Doppler sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/doppler/sync?dopplerProject=&dopplerConfig=&secretName=
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const dopplerProject = url.searchParams.get("dopplerProject");
    const dopplerConfig = url.searchParams.get("dopplerConfig");
    const secretName = url.searchParams.get("secretName");

    if (!dopplerProject || !dopplerConfig || !secretName) {
      return NextResponse.json(
        { error: "dopplerProject, dopplerConfig, and secretName are required" },
        { status: 400 }
      );
    }

    const token = await getDopplerToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Doppler not connected" }, { status: 400 });

    const deleteRes = await fetch(
      `https://api.doppler.com/v3/configs/config/secrets/note?project=${dopplerProject}&config=${dopplerConfig}&secret=${secretName}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!deleteRes.ok) {
      const err = await deleteRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.messages?.[0] || "Failed to delete secret from Doppler" },
        { status: deleteRes.status }
      );
    }

    return NextResponse.json({ success: true, deleted: secretName });
  } catch (error: any) {
    console.error("Doppler delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
