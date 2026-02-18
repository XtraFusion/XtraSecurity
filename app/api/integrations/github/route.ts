import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt, decrypt } from "@/lib/encription";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = process.env.NEXTAUTH_URL + "/api/integrations/github/callback";

// GET /api/integrations/github - Get GitHub integration status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integration = await prisma.integration.findUnique({
      where: {
        userId_provider: {
          userId: auth.userId,
          provider: "github"
        }
      },
      select: {
        username: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!integration) {
      // Return OAuth URL if not connected
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI!)}&scope=repo`;
      return NextResponse.json({
        connected: false,
        authUrl
      });
    }

    return NextResponse.json({
      connected: true,
      username: integration.username,
      avatarUrl: integration.avatarUrl,
      connectedAt: integration.createdAt
    });

  } catch (error: any) {
    console.error("GitHub integration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/github - Disconnect GitHub
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.integration.deleteMany({
      where: {
        userId: auth.userId,
        provider: "github"
      }
    });

    return NextResponse.json({ success: true, message: "GitHub disconnected" });

  } catch (error: any) {
    console.error("GitHub disconnect error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
