import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { encrypt } from "@/lib/encription";
import { verifyAuth } from "@/lib/server-auth";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = process.env.NEXTAUTH_URL + "/api/integrations/github/callback";

// GET /api/integrations/github/callback - OAuth callback
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      return NextResponse.redirect(new URL("/integrations?error=no_code", req.url));
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI
      })
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("GitHub OAuth error:", tokenData);
      return NextResponse.redirect(new URL(`/integrations?error=${tokenData.error}`, req.url));
    }

    // Get user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    const userData = await userRes.json();

    // Get session from cookies to identify user
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
    const auth = await verifyAuth(req);

    if (!auth?.userId) {
      return NextResponse.redirect(new URL("/integrations?error=not_authenticated", req.url));
    }

    // Encrypt and store token
    const encryptedToken = encrypt(tokenData.access_token);

    await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId: auth.userId,
          provider: "github"
        }
      },
      create: {
        userId: auth.userId,
        provider: "github",
        accessToken: JSON.stringify(encryptedToken),
        username: userData.login,
        avatarUrl: userData.avatar_url
      },
      update: {
        accessToken: JSON.stringify(encryptedToken),
        username: userData.login,
        avatarUrl: userData.avatar_url
      }
    });

    return NextResponse.redirect(new URL("/integrations?success=github_connected", req.url));

  } catch (error: any) {
    console.error("GitHub callback error:", error);
    return NextResponse.redirect(new URL(`/integrations?error=${error.message}`, req.url));
  }
}
