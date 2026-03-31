import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";

// GET /api/integrations/netlify — check connection status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "netlify" } },
      select: { username: true, avatarUrl: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });

    return NextResponse.json({
      connected: true,
      username: integration.username,
      avatarUrl: integration.avatarUrl,
      connectedAt: integration.createdAt,
    });
  } catch (error: any) {
    console.error("Netlify GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/netlify — save Personal Access Token
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "token is required" }, { status: 400 });

    // Validate token + fetch user info from Netlify
    const userRes = await fetch("https://api.netlify.com/api/v1/user", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userRes.ok) {
      const err = await userRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.message || "Invalid Netlify token. Check your Personal Access Token." },
        { status: 400 }
      );
    }

    const netlifyUser = await userRes.json();

    // Also fetch accounts list to get the primary accountId (needed for env var API)
    const accountsRes = await fetch("https://api.netlify.com/api/v1/accounts", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const accounts = accountsRes.ok ? await accountsRes.json() : [];
    const primaryAccountId = accounts?.[0]?.id || null;

    // Encrypt token and store
    const encryptedToken = encrypt(token);

    await prisma.integration.upsert({
      where: { userId_provider: { userId: auth.userId, provider: "netlify" } },
      create: {
        userId: auth.userId,
        provider: "netlify",
        accessToken: JSON.stringify(encryptedToken),
        username: netlifyUser?.slug || netlifyUser?.email || "netlify-user",
        avatarUrl: netlifyUser?.avatar_url || null,
        // Store accountId in config for use in env var API calls
        config: { accountId: primaryAccountId } as any,
        enabled: true,
        status: "connected",
      },
      update: {
        accessToken: JSON.stringify(encryptedToken),
        username: netlifyUser?.slug || netlifyUser?.email || "netlify-user",
        avatarUrl: netlifyUser?.avatar_url || null,
        config: { accountId: primaryAccountId } as any,
        status: "connected",
        enabled: true,
      },
    });

    return NextResponse.json({
      connected: true,
      username: netlifyUser?.slug || netlifyUser?.email,
    });
  } catch (error: any) {
    console.error("Netlify POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/netlify — disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "netlify" },
    });

    return NextResponse.json({ success: true, message: "Netlify disconnected" });
  } catch (error: any) {
    console.error("Netlify DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
