import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

const GITLAB_CLIENT_ID = process.env.GITLAB_CLIENT_ID;
const GITLAB_REDIRECT_URI = process.env.NEXTAUTH_URL + "/api/integrations/gitlab/callback";

// GET /api/integrations/gitlab - Get GitLab integration status
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
          provider: "gitlab"
        }
      },
      select: {
        username: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!integration) {
      const authUrl = `https://gitlab.com/oauth/authorize?client_id=${GITLAB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITLAB_REDIRECT_URI!)}&response_type=code&scope=api`;
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
    console.error("GitLab integration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/gitlab - Disconnect GitLab
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.integration.deleteMany({
      where: {
        userId: auth.userId,
        provider: "gitlab"
      }
    });

    return NextResponse.json({ success: true, message: "GitLab disconnected" });

  } catch (error: any) {
    console.error("GitLab disconnect error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
