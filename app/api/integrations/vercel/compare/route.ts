import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";

async function getVercelToken(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "vercel" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch { return null; }
}

// GET /api/integrations/vercel/compare?vercelProjectId=&projectId=&environment=
// Returns: { items: DiffItem[], latestDeployment, vercelEnvs }
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const vercelProjectId = url.searchParams.get("vercelProjectId");
    const projectId = url.searchParams.get("projectId");
    const environment = url.searchParams.get("environment");

    if (!vercelProjectId || !projectId || !environment) {
      return NextResponse.json({ error: "vercelProjectId, projectId, and environment required" }, { status: 400 });
    }

    const token = await getVercelToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Vercel not connected" }, { status: 400 });

    const envTargetMap: Record<string, string> = { development: "development", staging: "preview", production: "production" };
    const vercelTarget = envTargetMap[environment.toLowerCase()] ?? "production";

    // Parallel: fetch Vercel env vars + XtraSecurity secrets + latest deployment
    const [vercelEnvRes, allSecrets, deployRes] = await Promise.all([
      fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/env?decrypt=false`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      prisma.secret.findMany({
        where: { projectId },
        select: { key: true, value: true, environmentType: true },
      }),
      fetch(`https://api.vercel.com/v6/deployments?projectId=${vercelProjectId}&limit=1&state=READY`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    // Vercel env vars
    let vercelEnvs: { id: string; key: string; target: string[]; type: string }[] = [];
    if (vercelEnvRes.ok) {
      const data = await vercelEnvRes.json();
      vercelEnvs = (data.envs || []).filter((v: any) =>
        Array.isArray(v.target) && v.target.includes(vercelTarget)
      );
    }

    // XtraSecurity secrets for environment
    const xtraSecrets = allSecrets.filter(
      (s) => s.environmentType?.toLowerCase() === environment.toLowerCase()
    );

    const vercelKeyMap = new Map(vercelEnvs.map((v) => [v.key, v]));
    const xtraKeySet = new Set(xtraSecrets.map((s) => s.key.toUpperCase()));

    // Build diff items
    const items: {
      key: string;
      status: "new" | "in_sync" | "only_vercel";
      vercelId?: string;
      vercelType?: string;
    }[] = [];

    for (const s of xtraSecrets) {
      const upKey = s.key.toUpperCase();
      const vercelVar = vercelKeyMap.get(upKey);
      items.push({
        key: upKey,
        status: vercelVar ? "in_sync" : "new",
        vercelId: vercelVar?.id,
        vercelType: vercelVar?.type,
      });
    }

    for (const [vKey, vVar] of vercelKeyMap) {
      if (!xtraKeySet.has(vKey)) {
        items.push({ key: vKey, status: "only_vercel", vercelId: vVar.id, vercelType: vVar.type });
      }
    }

    // Latest deployment
    let latestDeployment = null;
    if (deployRes.ok) {
      const deployData = await deployRes.json();
      const dep = deployData.deployments?.[0];
      if (dep) {
        latestDeployment = {
          id: dep.uid,
          url: dep.url ? `https://${dep.url}` : null,
          state: dep.state,
          createdAt: dep.created,
        };
      }
    }

    return NextResponse.json({
      items,
      vercelEnvs: vercelEnvs.map((v) => ({ id: v.id, key: v.key, type: v.type })),
      latestDeployment,
      summary: {
        new: items.filter((i) => i.status === "new").length,
        inSync: items.filter((i) => i.status === "in_sync").length,
        onlyVercel: items.filter((i) => i.status === "only_vercel").length,
      },
    });
  } catch (error: any) {
    console.error("Vercel compare error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
