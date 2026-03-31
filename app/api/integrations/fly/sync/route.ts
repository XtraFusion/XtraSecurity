import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const FLY_GRAPHQL_URL = "https://api.fly.io/graphql";

async function getFlyToken(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "fly" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch {
    return null;
  }
}

// GET /api/integrations/fly/sync - List apps
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getFlyToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Fly.io not connected" }, { status: 400 });

    const query = `
      query {
        apps {
          nodes {
            name
            organization {
              slug
            }
          }
        }
      }
    `;

    const res = await axios.post(FLY_GRAPHQL_URL, { query }, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.data.errors) throw new Error(res.data.errors[0].message);

    const repos = res.data.data.apps.nodes.map((app: any) => ({
      id: app.name,
      name: app.name,
      fullName: app.name,
      owner: app.organization.slug,
      private: true,
      url: `https://fly.io/apps/${app.name}/secrets`,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/fly/sync - Batch set secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, flyAppName, secretPrefix } = await req.json();
    if (!projectId || !environment || !flyAppName) {
      return NextResponse.json({ error: "Missing Project ID, Environment, or Fly App Name" }, { status: 400 });
    }

    const token = await getFlyToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Fly.io not connected" }, { status: 400 });

    // Fetch secrets from XtraSecurity
    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) {
      return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });
    }

    const secretsToSet = envSecrets.map(s => {
      const rawKey = secretPrefix ? `${secretPrefix}_${s.key}` : s.key;
      const sanitizedKey = rawKey.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
      
      const encryptedValue = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
      const decryptedValue = decrypt(encryptedValue);
      
      return { key: sanitizedKey, value: decryptedValue };
    });

    const mutation = `
      mutation setSecrets($input: SetSecretsInput!) {
        setSecrets(input: $input) {
          release {
            id
            version
          }
        }
      }
    `;

    const variables = {
      input: {
        appId: flyAppName,
        secrets: secretsToSet
      }
    };

    const res = await axios.post(FLY_GRAPHQL_URL, { query: mutation, variables }, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.data.errors) throw new Error(res.data.errors[0].message);

    return NextResponse.json({
      success: true,
      app: flyAppName,
      release: res.data.data.setSecrets.release,
      summary: { total: secretsToSet.length, synced: secretsToSet.length, failed: 0 }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/fly/sync - Unset secret
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const flyAppName = url.searchParams.get("flyAppName");
    const secretName = url.searchParams.get("secretName");

    if (!flyAppName || !secretName) {
      return NextResponse.json({ error: "flyAppName and secretName are required" }, { status: 400 });
    }

    const token = await getFlyToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Fly.io not connected" }, { status: 400 });

    const mutation = `
      mutation unsetSecrets($input: UnsetSecretsInput!) {
        unsetSecrets(input: $input) {
          release {
            id
          }
        }
      }
    `;

    const variables = {
      input: {
        appId: flyAppName,
        keys: [secretName]
      }
    };

    const res = await axios.post(FLY_GRAPHQL_URL, { query: mutation, variables }, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.data.errors) throw new Error(res.data.errors[0].message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
