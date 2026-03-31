import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";

async function getVercelToken(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "vercel" } },
  });
  if (!integration?.accessToken) return null;
  try { return decrypt(JSON.parse(integration.accessToken)); }
  catch { return null; }
}

// POST /api/integrations/vercel/deploy — trigger redeploy of latest deployment
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { vercelProjectId } = await req.json();
    if (!vercelProjectId) return NextResponse.json({ error: "vercelProjectId is required" }, { status: 400 });

    const token = await getVercelToken(auth.userId);
    if (!token) return NextResponse.json({ error: "Vercel not connected" }, { status: 400 });

    // 1. Get the latest deployment
    const listRes = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${vercelProjectId}&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!listRes.ok) {
      return NextResponse.json({ error: "Failed to fetch deployments" }, { status: 500 });
    }

    const listData = await listRes.json();
    const latest = listData.deployments?.[0];

    if (!latest) {
      return NextResponse.json({ error: "No existing deployment found to redeploy" }, { status: 404 });
    }

    // 2. Trigger redeploy by copying the previous deployment
    const redeployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deploymentId: latest.uid,
        name: latest.name,
        target: latest.target || "production",
      }),
    });

    if (!redeployRes.ok) {
      const err = await redeployRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || "Failed to trigger redeploy" },
        { status: redeployRes.status }
      );
    }

    const redeployData = await redeployRes.json();

    return NextResponse.json({
      success: true,
      deploymentId: redeployData.id,
      url: redeployData.url ? `https://${redeployData.url}` : null,
      state: redeployData.readyState || "BUILDING",
    });
  } catch (error: any) {
    console.error("Vercel deploy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
