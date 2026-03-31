import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";

async function getNetlifyCreds(userId: string): Promise<{ token: string; accountId: string | null } | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "netlify" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const accountId = (integration.config as any)?.accountId || null;
    return { token, accountId };
  } catch { return null; }
}

// POST /api/integrations/netlify/deploy — trigger a new Netlify build
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { netlifySiteId, clearCache } = await req.json();
    if (!netlifySiteId) return NextResponse.json({ error: "netlifySiteId is required" }, { status: 400 });

    const creds = await getNetlifyCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Netlify not connected" }, { status: 400 });

    const buildRes = await fetch(`https://api.netlify.com/api/v1/sites/${netlifySiteId}/builds`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(clearCache ? { clear_cache: true } : {}),
    });

    if (!buildRes.ok) {
      const err = await buildRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.message || "Failed to trigger build" },
        { status: buildRes.status }
      );
    }

    const buildData = await buildRes.json();

    return NextResponse.json({
      success: true,
      buildId: buildData.id,
      state: buildData.state || "building",
      deployId: buildData.deploy_id,
    });
  } catch (error: any) {
    console.error("Netlify deploy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
