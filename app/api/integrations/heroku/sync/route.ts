import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import { notify } from "@/lib/notifier";
import axios from "axios";

const HEROKU_BASE_URL = "https://api.heroku.com";
const HEROKU_HEADERS = {
  "Accept": "application/vnd.heroku+json; version=3",
  "Content-Type": "application/json"
};

async function getHerokuToken(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "heroku" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch {
    return null;
  }
}

// GET /api/integrations/heroku/sync - List Heroku apps
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getHerokuToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Heroku not connected" }, { status: 400 });

    const res = await axios.get(`${HEROKU_BASE_URL}/apps`, {
      headers: { ...HEROKU_HEADERS, "Authorization": `Bearer ${token}` }
    });

    const apps = res.data.map((a: any) => ({
      id: a.id,
      name: a.name,
      fullName: a.name,
      owner: a.owner.email,
      private: true,
      url: `https://dashboard.heroku.com/apps/${a.name}/settings`,
      type: "app",
    }));

    return NextResponse.json({ repos: apps });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/integrations/heroku/sync - Sync secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, appId, secretPrefix } = await req.json();
    if (!projectId || !environment || !appId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const token = await getHerokuToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Heroku not connected" }, { status: 400 });

    // 1. Fetch project for workspace context and verify access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [{ userId: auth.userId }, { teamProjects: { some: { team: { members: { some: { userId: auth.userId, status: "active" } } } } } }]
      },
      select: { workspaceId: true }
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
    }

    // 2. Fetch secrets from XtraSecurity
    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) {
      return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });
    }

    // 2. Format for Heroku (PATCH /config-vars)
    const configVars: Record<string, string> = {};
    const results: { key: string; success: boolean; error?: string }[] = [];

    for (const secret of envSecrets) {
      const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
      const sanitizedKey = rawKey.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

      const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
      const decryptedValue = decrypt(encryptedValue);

      configVars[sanitizedKey] = decryptedValue;
      results.push({ key: sanitizedKey, success: true });
    }

    // 3. Patch Heroku
    try {
      await axios.patch(`${HEROKU_BASE_URL}/apps/${appId}/config-vars`, configVars, {
        headers: { ...HEROKU_HEADERS, "Authorization": `Bearer ${token}` }
      });
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      return NextResponse.json({ error: `Heroku Sync failed: ${msg}` }, { status: 500 });
    }

    // Trigger Unified Notifications (non-blocking)
    notify(
      auth.userId,
      "Heroku Sync Complete",
      `Successfully synced ${results.length} secrets to Heroku.`,
      `App: ${appId} | Environment: ${environment}`,
      project.workspaceId
    ).catch(e => console.error("Notify Error:", e));

    return NextResponse.json({
      success: true,
      summary: { total: results.length, synced: results.length, failed: 0 },
      results
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/heroku/sync - Delete secret
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const appId = url.searchParams.get("appId");
    const secretName = url.searchParams.get("secretName");

    if (!appId || !secretName) {
      return NextResponse.json({ error: "Missing appId or secretName" }, { status: 400 });
    }

    const token = await getHerokuToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Heroku not connected" }, { status: 400 });

    // Heroku delete is PATCH with null
    await axios.patch(`${HEROKU_BASE_URL}/apps/${appId}/config-vars`, { [secretName]: null }, {
      headers: { ...HEROKU_HEADERS, "Authorization": `Bearer ${token}` }
    });

    if (true) {
        // Find workspace for notifications
        const project = await prisma.project.findFirst({
            where: { userId: auth.userId },
            select: { workspaceId: true }
        });

        // Trigger Unified Notifications (non-blocking)
        notify(
            auth.userId,
            "Secret Deleted from Heroku",
            `Removed '${secretName}' from Heroku.`,
            `App: ${appId}`,
            project?.workspaceId
        ).catch(e => console.error("Notify Error:", e));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
