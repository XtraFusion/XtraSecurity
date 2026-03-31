import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const RENDER_BASE_URL = "https://api.render.com/v1";

async function getRenderToken(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "render" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch {
    return null;
  }
}

// GET /api/integrations/render/sync - List services and groups
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getRenderToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Render not connected" }, { status: 400 });

    const [servicesRes, groupsRes] = await Promise.all([
      axios.get(`${RENDER_BASE_URL}/services?limit=100`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      }),
      axios.get(`${RENDER_BASE_URL}/env-groups?limit=100`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      })
    ]);

    const services = servicesRes.data.map((s: any) => ({
      id: `service:${s.service.id}`,
      name: s.service.name,
      fullName: `${s.service.name} (${s.service.type})`,
      owner: s.service.ownerId,
      private: true,
      url: `https://dashboard.render.com/${s.service.type}/${s.service.id}/env`,
      type: "service",
      realId: s.service.id
    }));

    const groups = groupsRes.data.map((g: any) => ({
      id: `group:${g.envGroup.id}`,
      name: g.envGroup.name,
      fullName: `${g.envGroup.name} (Env Group)`,
      owner: g.envGroup.ownerId,
      private: true,
      url: `https://dashboard.render.com/env-groups/${g.envGroup.id}`,
      type: "group",
      realId: g.envGroup.id
    }));

    return NextResponse.json({ repos: [...services, ...groups] });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/integrations/render/sync - Sync secrets
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, environment, targetId, secretPrefix } = await req.json();
    if (!projectId || !environment || !targetId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const token = await getRenderToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Render not connected" }, { status: 400 });

    const [targetType, realId] = targetId.split(":");
    const isGroup = targetType === "group";

    // Fetch secrets from XtraSecurity
    const allSecrets = await prisma.secret.findMany({
      where: { projectId },
      select: { key: true, value: true, environmentType: true },
    });

    const envSecrets = allSecrets.filter(s => s.environmentType?.toLowerCase() === environment.toLowerCase());
    if (envSecrets.length === 0) {
      return NextResponse.json({ error: "No secrets found for this environment" }, { status: 404 });
    }

    const results: { key: string; success: boolean; error?: string }[] = [];
    let syncedCount = 0;

    // Render's bulk PUT /env-vars replaces EVERYTHING. 
    // To be safe and additive, we'll use individual PUTs for each secret.
    for (const secret of envSecrets) {
      try {
        const rawKey = secretPrefix ? `${secretPrefix}_${secret.key}` : secret.key;
        const sanitizedKey = rawKey.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

        const encryptedValue = typeof secret.value === "string" ? JSON.parse(secret.value) : secret.value;
        const decryptedValue = decrypt(encryptedValue);

        const url = isGroup 
          ? `${RENDER_BASE_URL}/env-groups/${realId}/env-vars/${sanitizedKey}`
          : `${RENDER_BASE_URL}/services/${realId}/env-vars/${sanitizedKey}`;

        await axios.put(url, { value: decryptedValue }, {
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        });

        results.push({ key: sanitizedKey, success: true });
        syncedCount++;
      } catch (e: any) {
        const msg = e.response?.data?.message || e.message;
        results.push({ key: secret.key, success: false, error: msg });
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

// DELETE /api/integrations/render/sync - Delete secret
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const targetId = url.searchParams.get("targetId");
    const secretName = url.searchParams.get("secretName");

    if (!targetId || !secretName) {
      return NextResponse.json({ error: "Missing targetId or secretName" }, { status: 400 });
    }

    const token = await getRenderToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Render not connected" }, { status: 400 });

    const [targetType, realId] = targetId.split(":");
    const isGroup = targetType === "group";

    const deleteUrl = isGroup 
      ? `${RENDER_BASE_URL}/env-groups/${realId}/env-vars/${secretName}`
      : `${RENDER_BASE_URL}/services/${realId}/env-vars/${secretName}`;

    await axios.delete(deleteUrl, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
