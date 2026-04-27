import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import { notify } from "@/lib/notifier";
import axios from "axios";

const DO_BASE_URL = "https://api.digitalocean.com/v2";

async function getDOToken(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "digitalocean" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch {
    return null;
  }
}

// GET /api/integrations/digitalocean/sync - List DO apps
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getDOToken(auth.userId);
    if (!token) return NextResponse.json({ error: "DigitalOcean not connected" }, { status: 400 });

    const res = await axios.get(`${DO_BASE_URL}/apps`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const apps = res.data.apps.map((a: any) => ({
      id: a.id,
      name: a.spec.name,
      fullName: `${a.spec.name} (${a.region.slug})`,
      owner: a.owner_uuid,
      private: true,
      url: `https://cloud.digitalocean.com/apps/${a.id}/settings/env-vars`,
      type: "app",
    }));

    return NextResponse.json({ repos: apps });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/integrations/digitalocean/sync - Sync secrets via App Spec
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, appId, secretPrefix } = await req.json();
    if (!projectId || !environment || !appId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const token = await getDOToken(auth.userId);
    if (!token) return NextResponse.json({ error: "DigitalOcean not connected" }, { status: 400 });

    // 1. Fetch current app details to get the spec
    const appRes = await axios.get(`${DO_BASE_URL}/apps/${appId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const currentApp = appRes.data.app;
    const spec = currentApp.spec;

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

    // 3. Update the spec (root level envs)
    if (!spec.envs) spec.envs = [];

    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;

    for (const secret of envSecrets) {
      const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
      const sanitizedKey = rawKey.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

      const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
      const decryptedValue = decrypt(encryptedValue);

      // Add or Update in the DO spec envs array
      const existingIdx = spec.envs.findIndex((e: any) => e.key === sanitizedKey);
      const envEntry = {
        key: sanitizedKey,
        scope: "RUN_TIME",
        type: "SECRET",
        value: decryptedValue
      };

      if (existingIdx >= 0) {
        spec.envs[existingIdx] = envEntry;
      } else {
        spec.envs.push(envEntry);
      }
      
      results.push({ key: sanitizedKey, success: true });
      syncedCount++;
    }

    // 4. PUT the updated spec back
    try {
      await axios.put(`${DO_BASE_URL}/apps/${appId}`, { spec }, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      return NextResponse.json({ error: `Failed to update App Spec: ${msg}` }, { status: 500 });
    }

    // Trigger Unified Notifications (non-blocking)
    notify(
      auth.userId,
      "DigitalOcean Sync Complete",
      `Successfully synced ${results.length} secrets to DigitalOcean App Platform.`,
      `Successfully synced ${results.length} secrets to DigitalOcean App Platform.`,
      `App: ${appId} | Environment: ${environment}`,
      project.workspaceId
    ).catch(e => console.error("Notify Error:", e));

    return NextResponse.json({
      success: true,
      summary: { total: results.length, synced: syncedCount, failed: 0 },
      results
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/digitalocean/sync - Delete secret from App Spec
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

    const token = await getDOToken(auth.userId);
    if (!token) return NextResponse.json({ error: "DigitalOcean not connected" }, { status: 400 });

    // 1. Fetch current app details to get the spec
    const appRes = await axios.get(`${DO_BASE_URL}/apps/${appId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const spec = appRes.data.app.spec;

    // 2. Filter out the secret
    if (spec.envs) {
      spec.envs = spec.envs.filter((e: any) => e.key !== secretName);
      
      // 3. PUT the updated spec back
      await axios.put(`${DO_BASE_URL}/apps/${appId}`, { spec }, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
    }

    if (true) {
        // Find workspace for notifications
        const project = await prisma.project.findFirst({
            where: { userId: auth.userId },
            select: { workspaceId: true }
        });

        // Trigger Unified Notifications (non-blocking)
        notify(
            auth.userId,
            "Secret Deleted from DigitalOcean",
            `Removed '${secretName}' from DigitalOcean App.`,
            `App: ${appId}`,
            project?.workspaceId
        ).catch(e => console.error("Notify Error:", e));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
