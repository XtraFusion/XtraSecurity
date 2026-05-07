import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verifyAuth } from "@/lib/server-auth";

const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback_secret";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");

  if (!callbackUrl) {
    return NextResponse.json({ error: "Missing callbackUrl" }, { status: 400 });
  }

  // Security: Allow only localhost ports for CLI callback
  const url = new URL(callbackUrl);
  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      return NextResponse.json({ error: "Invalid callbackUrl. Must be localhost." }, { status: 400 });
  }

  if (!auth) {
    // Redirect to login page with return URL
    // We encode the current URL as the callback for the login page
    const ssoUrl =  encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/cli/sso?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login?callbackUrl=${ssoUrl}`);
  }

  // Generate Token
  // Redirect to Workspace Selection Page
  const selectionUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/cli/workspace?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  return NextResponse.redirect(selectionUrl);
}
