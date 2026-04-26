import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all connected integrations for this user in one query
    const integrations = await prisma.integration.findMany({
      where: { userId: auth.userId }
    });

    const statuses: Record<string, any> = {};

    // Map the connected ones
    for (const intg of integrations) {
      statuses[intg.provider] = {
        connected: true,
        username: intg.username,
        avatarUrl: intg.avatarUrl,
        connectedAt: intg.createdAt
      };
    }

    // Safely inject OAuth URLs for key providers if they are not yet connected
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    
    if (!statuses["github"]) {
      const clientId = process.env.GITHUB_CLIENT_ID;
      if (clientId) {
        const redirectUri = `${baseUrl}/api/integrations/github/callback`;
        statuses["github"] = {
          connected: false,
          authUrl: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo`
        };
      }
    }
    
    if (!statuses["gitlab"]) {
      const clientId = process.env.GITLAB_CLIENT_ID;
      if (clientId) {
        const redirectUri = `${baseUrl}/api/integrations/gitlab/callback`;
        statuses["gitlab"] = {
          connected: false,
          authUrl: `https://gitlab.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=api`
        };
      }
    }

    return NextResponse.json({ statuses }, { status: 200 });

  } catch (error: any) {
    console.error("Bulk integration status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
