import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getSentryCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "sentry" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, org: cfg?.org };
  } catch { return null; }
}

// GET /api/integrations/sentry/sync - List Projects
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getSentryCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Sentry not connected" }, { status: 400 });

    const headers = { "Authorization": `Bearer ${creds.token}` };
    const res = await axios.get(`https://sentry.io/api/0/organizations/${creds.org}/projects/`, { headers, timeout: 8000 });
    
    const repos = (res.data || []).map((p: any) => ({
      id: p.slug,
      name: p.name,
      fullName: p.slug,
      owner: p.team?.name || "Team",
      private: true,
      url: `https://sentry.io/organizations/${creds.org}/projects/${p.slug}/`,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/sentry/sync - Create Sentry Issue
export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "Sentry Direct Issue creation via API requires Project DSN or specialized integration scoping. Manual sync is coming soon." }, { status: 501 });
}
