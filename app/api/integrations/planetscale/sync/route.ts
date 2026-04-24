import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const PS_API = "https://api.planetscale.com/v1";

async function getPSCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "planetscale" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, org: cfg?.org, tokenId: cfg?.serviceTokenId };
  } catch { return null; }
}

// GET /api/integrations/planetscale/sync - List databases and branches
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getPSCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "PlanetScale not connected" }, { status: 400 });

    const headers = { "Authorization": `${creds.tokenId}:${creds.token}` };
    const dbRes = await axios.get(`${PS_API}/organizations/${creds.org}/databases`, { headers, timeout: 8000 });
    
    const repos: any[] = [];
    for (const db of dbRes.data?.data || []) {
      const branchRes = await axios.get(`${PS_API}/organizations/${creds.org}/databases/${db.name}/branches`, { headers });
      for (const branch of branchRes.data?.data || []) {
        repos.push({
          id: `${db.name}:${branch.name}`,
          name: `${db.name} / ${branch.name}`,
          fullName: `${db.name}:${branch.name}`,
          owner: db.name,
          private: true,
          url: `https://app.planetscale.com/${creds.org}/${db.name}/${branch.name}`,
        });
      }
    }

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/planetscale/sync - Push Secrets
// Note: PlanetScale API doesn't have a direct "Env Var" sync via the public API for the DB itself 
// unless it's for Connect strings or using the PlanetScale CLI. 
// However, we can sync secrets to a specialized 'XtraSecurity' metafield or database configuration.
// Let's treat this as syncing to Database "Properties" or similar if available, 
// but since the Env Var API is for Cloudflare/Vercel integrations, 
// we'll sync them as a "Secure JSON" in the database description or metadata as a placeholder 
// for the user to pick up in their CI/CD. 
// Actually, let's just implement the logic for syncing to a deployment target if available.
// For now, let's sync to 'environment-variables' if the user has a PlanetScale integration with Vercel.

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "PlanetScale environment variable sync requires a linked Vercel/Cloudflare integration. Direct DB sync is coming soon." }, { status: 501 });
}
