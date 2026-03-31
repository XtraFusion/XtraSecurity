import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";

async function getNetlifyCreds(userId: string): Promise<{ token: string; accountId: string | null } | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "netlify" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const accountId = (integration.config as any)?.accountId || null;
    return { token, accountId };
  } catch { return null; }
}

const CONTEXT_MAP: Record<string, string> = {
  development: "dev", staging: "branch-deploy", production: "production",
};

// GET /api/integrations/netlify/compare?netlifySiteId=&projectId=&environment=&accountId=
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const netlifySiteId = url.searchParams.get("netlifySiteId");
    const projectId = url.searchParams.get("projectId");
    const environment = url.searchParams.get("environment");
    const accountIdParam = url.searchParams.get("accountId");

    if (!netlifySiteId || !projectId || !environment) {
      return NextResponse.json({ error: "netlifySiteId, projectId, and environment required" }, { status: 400 });
    }

    const creds = await getNetlifyCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Netlify not connected" }, { status: 400 });

    const accountId = accountIdParam || creds.accountId;
    const netlifyContext = CONTEXT_MAP[environment.toLowerCase()] ?? "production";

    // Parallel: fetch Netlify env vars + XtraSecurity secrets + latest deploy
    const [netlifyEnvRes, allSecrets, deployRes] = await Promise.all([
      fetch(
        `https://api.netlify.com/api/v1/accounts/${accountId}/env?site_id=${netlifySiteId}&context_name=${netlifyContext}`,
        { headers: { Authorization: `Bearer ${creds.token}` } }
      ),
      prisma.secret.findMany({
        where: { projectId },
        select: { key: true, value: true, environmentType: true },
      }),
      fetch(`https://api.netlify.com/api/v1/sites/${netlifySiteId}/deploys?per_page=1`, {
        headers: { Authorization: `Bearer ${creds.token}` },
      }),
    ]);

    let netlifyEnvs: { key: string; values: { value: string; context: string }[] }[] = [];
    if (netlifyEnvRes.ok) {
      netlifyEnvs = await netlifyEnvRes.json();
    }

    const xtraSecrets = allSecrets.filter(
      (s) => s.environmentType?.toLowerCase() === environment.toLowerCase()
    );

    const netlifyKeySet = new Set(netlifyEnvs.map((v) => v.key));
    const xtraKeySet = new Set(xtraSecrets.map((s) => s.key.toUpperCase()));

    const items: { key: string; status: "new" | "in_sync" | "only_netlify" }[] = [];

    for (const s of xtraSecrets) {
      const upKey = s.key.toUpperCase();
      items.push({ key: upKey, status: netlifyKeySet.has(upKey) ? "in_sync" : "new" });
    }

    for (const nKey of netlifyKeySet) {
      if (!xtraKeySet.has(nKey)) {
        items.push({ key: nKey, status: "only_netlify" });
      }
    }

    // Latest deploy
    let latestDeployment = null;
    if (deployRes.ok) {
      const deploys = await deployRes.json();
      const dep = deploys?.[0];
      if (dep) {
        latestDeployment = {
          id: dep.id,
          url: dep.ssl_url || dep.url,
          state: dep.state,
          createdAt: dep.created_at,
        };
      }
    }

    return NextResponse.json({
      items,
      netlifyEnvs: netlifyEnvs.map((v) => ({ key: v.key, context: netlifyContext })),
      latestDeployment,
      summary: {
        new: items.filter((i) => i.status === "new").length,
        inSync: items.filter((i) => i.status === "in_sync").length,
        onlyNetlify: items.filter((i) => i.status === "only_netlify").length,
      },
    });
  } catch (error: any) {
    console.error("Netlify compare error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
