import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback_secret";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reqBody = await req.json();
  const { workspaceId, callbackUrl } = reqBody;

  if (!callbackUrl) {
    return NextResponse.json({ error: "Missing callbackUrl" }, { status: 400 });
  }

  // Security check for callbackUrl
  const url = new URL(callbackUrl);
  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      return NextResponse.json({ error: "Invalid callbackUrl" }, { status: 400 });
  }

  // Generate Token
  const payload = {
    id: session.user.id,
    email: session.user.email,
    role: (session.user as any).role,
    type: "cli-token",
    // We can embed workspaceId if we switch to scoped keys, but for now we just pass it back
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "30d" });

  // Construct Redirect URL with Token AND Workspace
  const redirectTarget = `${callbackUrl}?token=${token}&email=${session.user.email}&workspaceId=${workspaceId}&workspaceName=${encodeURIComponent(reqBody.workspaceName || "Unknown Workspace")}`;

  return NextResponse.json({ redirectUrl: redirectTarget });
}
