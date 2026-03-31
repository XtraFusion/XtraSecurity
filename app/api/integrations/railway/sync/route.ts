import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const RAILWAY_GRAPHQL_URL = "https://backboard.railway.app/graphql/v2";

async function getRailwayToken(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "railway" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch {
    return null;
  }
}

// GET /api/integrations/railway/sync - List projects and environments
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getRailwayToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Railway not connected" }, { status: 400 });

    const query = `
      query {
        projects {
          edges {
            node {
              id
              name
              environments {
                edges {
                  node {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    const res = await axios.post(RAILWAY_GRAPHQL_URL, { query }, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.data.errors) throw new Error(res.data.errors[0].message);

    const projects = res.data.data.projects.edges.map((e: any) => ({
      id: e.node.id,
      name: e.node.name,
      environments: e.node.environments.edges.map((env: any) => ({
        id: env.node.id,
        name: env.node.name
      }))
    }));

    // Format for the frontend repos dropdown (Map environments as targets)
    const repos = projects.flatMap((p: any) => 
      p.environments.map((env: any) => ({
        id: `${p.id}:${env.id}`, // Custom composite ID
        name: `${p.name} - ${env.name}`,
        fullName: `${p.name} / ${env.name}`,
        owner: p.name,
        private: true,
        url: `https://railway.app/project/${p.id}/environment/${env.id}/variables`,
        projectId: p.id,
        environmentId: env.id
      }))
    );

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/railway/sync - Sync secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, railwayProjectId, railwayEnvironmentId, secretPrefix } = await req.json();
    if (!projectId || !environment || !railwayProjectId || !railwayEnvironmentId) {
      return NextResponse.json({ error: "Missing required fields (Project/Environment ID)" }, { status: 400 });
    }

    const token = await getRailwayToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Railway not connected" }, { status: 400 });

    // Fetch secrets from XtraSecurity
    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) {
      return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });
    }

    // Since Railway's variableUpsert is individual, we use variableCollectionUpsert if possible, or Promise.all individual ones.
    // Let's use the individual one for reliability as some accounts have limitations.
    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;

    for (const secret of envSecrets) {
      try {
        const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
        const sanitizedKey = rawKey.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);

        const mutation = `
          mutation variableUpsert($input: VariableUpsertInput!) {
            variableUpsert(input: $input) {
              name
            }
          }
        `;

        const variables = {
          input: {
            projectId: railwayProjectId,
            environmentId: railwayEnvironmentId,
            name: sanitizedKey,
            value: decryptedValue
          }
        };

        const res = await axios.post(RAILWAY_GRAPHQL_URL, { query: mutation, variables }, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.data.errors) throw new Error(res.data.errors[0].message);

        results.push({ key: sanitizedKey, success: true });
        syncedCount++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      summary: { total: results.length, synced: syncedCount, failed: results.length - syncedCount },
      results
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/railway/sync - Delete secret
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const railwayProjectId = url.searchParams.get("railwayProjectId");
    const railwayEnvironmentId = url.searchParams.get("railwayEnvironmentId");
    const secretName = url.searchParams.get("secretName");

    if (!railwayProjectId || !railwayEnvironmentId || !secretName) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const token = await getRailwayToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Railway not connected" }, { status: 400 });

    const mutation = `
      mutation variableDelete($projectId: String!, $environmentId: String!, $name: String!) {
        variableDelete(projectId: $projectId, environmentId: $environmentId, name: $name)
      }
    `;

    const variables = { projectId: railwayProjectId, environmentId: railwayEnvironmentId, name: secretName };

    const res = await axios.post(RAILWAY_GRAPHQL_URL, { query: mutation, variables }, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.data.errors) throw new Error(res.data.errors[0].message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
