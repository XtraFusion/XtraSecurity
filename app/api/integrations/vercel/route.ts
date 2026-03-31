import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt, decrypt } from "@/lib/encription";

// GET /api/integrations/vercel — check connection status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "vercel" } },
      select: { username: true, avatarUrl: true, createdAt: true },
    });

    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      username: integration.username,
      avatarUrl: integration.avatarUrl,
      connectedAt: integration.createdAt,
    });
  } catch (error: any) {
    console.error("Vercel GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/vercel — save a Personal Access Token
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "token is required" }, { status: 400 });

    // Validate the token against Vercel API
    const userRes = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userRes.ok) {
      const err = await userRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || "Invalid Vercel token" },
        { status: 400 }
      );
    }

    const userData = await userRes.json();
    const vercelUser = userData.user;

    // Encrypt and upsert
    const encryptedToken = encrypt(token);

    await prisma.integration.upsert({
      where: { userId_provider: { userId: auth.userId, provider: "vercel" } },
      create: {
        userId: auth.userId,
        provider: "vercel",
        accessToken: JSON.stringify(encryptedToken),
        username: vercelUser?.username || vercelUser?.email || "vercel-user",
        avatarUrl: vercelUser?.avatar
          ? `https://vercel.com/api/www/avatar/${vercelUser.avatar}`
          : null,
        enabled: true,
        status: "connected",
      },
      update: {
        accessToken: JSON.stringify(encryptedToken),
        username: vercelUser?.username || vercelUser?.email || "vercel-user",
        avatarUrl: vercelUser?.avatar
          ? `https://vercel.com/api/www/avatar/${vercelUser.avatar}`
          : null,
        status: "connected",
        enabled: true,
      },
    });

    return NextResponse.json({
      connected: true,
      username: vercelUser?.username || vercelUser?.email,
    });
  } catch (error: any) {
    console.error("Vercel POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/vercel — disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.integration.deleteMany({
      where: { userId: auth.userId, provider: "vercel" },
    });

    return NextResponse.json({ success: true, message: "Vercel disconnected" });
  } catch (error: any) {
    console.error("Vercel DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
