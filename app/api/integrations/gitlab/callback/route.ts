import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { encrypt } from "@/lib/encription";

const GITLAB_CLIENT_ID = process.env.GITLAB_CLIENT_ID;
const GITLAB_SECRET = process.env.GITLAB_SECRET;
const GITLAB_REDIRECT_URI = process.env.NEXTAUTH_URL + "/api/integrations/gitlab/callback";

// GET /api/integrations/gitlab/callback - OAuth callback
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(new URL("/integrations?error=no_code", req.url));
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://gitlab.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: GITLAB_CLIENT_ID,
        client_secret: GITLAB_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: GITLAB_REDIRECT_URI
      })
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("GitLab OAuth error:", tokenData);
      return NextResponse.redirect(new URL(`/integrations?error=${tokenData.error_description || tokenData.error}`, req.url));
    }

    // Get user info
    const userRes = await fetch("https://gitlab.com/api/v4/user", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      }
    });

    const userData = await userRes.json();

    // Get session from cookies to identify user
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/integrations?error=not_authenticated", req.url));
    }

    // Encrypt and store token
    const encryptedToken = encrypt(tokenData.access_token);

    await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: "gitlab"
        }
      },
      create: {
        userId: session.user.id,
        provider: "gitlab",
        accessToken: JSON.stringify(encryptedToken),
        username: userData.username,
        avatarUrl: userData.avatar_url
      },
      update: {
        accessToken: JSON.stringify(encryptedToken),
        username: userData.username,
        avatarUrl: userData.avatar_url
      }
    });

    return NextResponse.redirect(new URL("/integrations?success=gitlab_connected", req.url));

  } catch (error: any) {
    console.error("GitLab callback error:", error);
    return NextResponse.redirect(new URL(`/integrations?error=${error.message}`, req.url));
  }
}
