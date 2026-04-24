import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const HASURA_API = "https://api.hasura.io/v1/graphql";

async function getHasuraCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "hasura" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch { return null; }
}

// GET /api/integrations/hasura/sync - List projects
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getHasuraCreds(auth.userId);
    if (!token) return NextResponse.json({ error: "Hasura not connected" }, { status: 400 });

    const query = { query: `query { projects { id name region } }` };
    const res = await axios.post(HASURA_API, query, {
      headers: { "Authorization": `Bearer ${token}` },
      timeout: 8000,
    });

    const repos = (res.data?.data?.projects || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      fullName: p.id,
      owner: p.region,
      private: true,
      url: `https://cloud.hasura.io/project/${p.id}/settings/env-vars`,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/hasura/sync - Update Env Vars
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json();
    const token = await getHasuraCreds(auth.userId);
    if (!token) return NextResponse.json({ error: "Hasura not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found" }, { status: 404 });

    // Hasura Cloud uses GraphQL to update env vars
    // We need to fetch existing ones first or just overwrite 
    // The API allows updating specific keys
    
    const results: any[] = [];
    let synced = 0;

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const key = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;

        const updateMutation = {
          query: `mutation ($projectId: uuid!, $key: String!, $value: String!) {
            updateProjectEnvVar(projectId: $projectId, key: $key, value: $value) {
              key
            }
          }`,
          variables: { projectId: targetId, key, value: decryptedValue }
        };

        await axios.post(HASURA_API, updateMutation, {
          headers: { "Authorization": `Bearer ${token}` },
          timeout: 8000,
        });

        results.push({ key, success: true });
        synced++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.message });
      }
    }

    return NextResponse.json({ success: true, summary: { total: results.length, synced, failed: results.length - synced }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
