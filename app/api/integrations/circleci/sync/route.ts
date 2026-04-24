import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const CIRCLECI_API = "https://circleci.com/api/v2";

async function getCircleToken(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "circleci" } },
  });
  if (!integration?.accessToken) return null;
  try { return decrypt(JSON.parse(integration.accessToken)); } catch { return null; }
}

// GET /api/integrations/circleci/sync - List projects
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getCircleToken(auth.userId);
    if (!token) return NextResponse.json({ error: "CircleCI not connected" }, { status: 400 });

    const res = await axios.get(`${CIRCLECI_API}/me/collaborations`, {
      headers: { "Circle-Token": token },
      timeout: 8000,
    });

    const repos = (res.data || []).map((org: any) => ({
      id: `${org.vcs_type}/${org.slug}`,
      name: org.name || org.slug,
      fullName: `${org.vcs_type}/${org.slug}`,
      owner: org.slug,
      private: true,
      url: `https://app.circleci.com/pipelines/${org.vcs_type}/${org.slug}`,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/circleci/sync - Sync secrets as CircleCI environment variables
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json();
    if (!projectId || !environment || !targetId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const token = await getCircleToken(auth.userId);
    if (!token) return NextResponse.json({ error: "CircleCI not connected" }, { status: 400 });

    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });

    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;

    for (const secret of envSecrets) {
      try {
        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);
        const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
        const sanitizedKey = rawKey.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

        // CircleCI: POST to create or update env var in a project
        await axios.post(
          `${CIRCLECI_API}/project/${targetId}/envvar`,
          { name: sanitizedKey, value: decryptedValue },
          { headers: { "Circle-Token": token, "Content-Type": "application/json" }, timeout: 8000 }
        );

        results.push({ key: sanitizedKey, success: true });
        syncedCount++;
      } catch (e: any) {
        results.push({ key: secret.key, success: false, error: e.response?.data?.message || e.message });
      }
    }

    return NextResponse.json({ success: true, summary: { total: results.length, synced: syncedCount, failed: results.length - syncedCount }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/circleci/sync - Delete env var from CircleCI project
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const targetId = url.searchParams.get("targetId");
    const secretName = url.searchParams.get("secretName");

    if (!targetId || !secretName) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const token = await getCircleToken(auth.userId);
    if (!token) return NextResponse.json({ error: "CircleCI not connected" }, { status: 400 });

    await axios.delete(`${CIRCLECI_API}/project/${targetId}/envvar/${secretName}`, {
      headers: { "Circle-Token": token },
      timeout: 8000,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
