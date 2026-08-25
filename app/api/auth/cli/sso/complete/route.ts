import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { logAudit } from "@/lib/audit";
import { verifyAuth } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  const SECRET_KEY = process.env.NEXTAUTH_SECRET;
  if (!SECRET_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const auth = await verifyAuth(req);
  
  if (!auth) {
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
    id: auth.userId,
    email: auth.email,
    role: (auth as any).role,
    type: "cli-token",
  };

  const token = jwt.sign(payload, SECRET_KEY!, { expiresIn: "24h" });

  // Construct Redirect URL with Token AND Workspace
  const redirectTarget = `${callbackUrl}?token=${token}&email=${auth.email}&workspaceId=${workspaceId}&workspaceName=${encodeURIComponent(reqBody.workspaceName || "Unknown Workspace")}`;

  // Audit Log
  await logAudit(
    "USER_LOGIN_CLI_SSO",
    auth.userId,
    auth.userId,
    { method: "sso" },
    workspaceId || undefined
  );

  return NextResponse.json({ redirectUrl: redirectTarget });
}
