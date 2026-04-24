import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getGLCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "gitlabselfmanaged" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, url: cfg.instanceUrl };
  } catch { return null; }
}

// GET /api/integrations/gitlabselfmanaged/sync - List projects
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getGLCreds(auth.userId);
    if (!creds) return NextResponse.json({ repos: [] });

    const res = await axios.get(`${creds.url}/api/v4/projects?membership=true&min_access_level=30`, {
      headers: { "PRIVATE-TOKEN": creds.token }
    });

    const repos = res.data.map((p: any) => ({
      id: p.id,
      name: p.name,
      fullName: p.path_with_namespace,
      owner: p.namespace.name,
      private: p.visibility === "private",
      url: p.web_url
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/gitlabselfmanaged/sync - Push secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, repoId, environment } = await req.json();
    const creds = await getGLCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "GitLab not connected" }, { status: 400 });

    const secrets = await prisma.secret.findMany({
      where: { projectId, environmentType: environment },
    });

    const headers = { "PRIVATE-TOKEN": creds.token };

    for (const secret of secrets) {
      try {
        await axios.post(`${creds.url}/api/v4/projects/${repoId}/variables`, {
          key: secret.key,
          value: secret.value,
          variable_type: "env_var",
          protected: true,
          masked: true,
          environment_scope: "*"
        }, { headers });
      } catch (e: any) {
        if (e.response?.status === 400) {
          await axios.put(`${creds.url}/api/v4/projects/${repoId}/variables/${secret.key}`, {
            value: secret.value
          }, { headers });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
