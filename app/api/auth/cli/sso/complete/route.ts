import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createTamperEvidentLog } from "@/lib/audit";
import { verifyAuth } from "@/lib/server-auth";

const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback_secret";

export async function POST(req: NextRequest) {
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
    // We can embed workspaceId if we switch to scoped keys, but for now we just pass it back
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "30d" });

  // Construct Redirect URL with Token AND Workspace
  const redirectTarget = `${callbackUrl}?token=${token}&email=${auth.email}&workspaceId=${workspaceId}&workspaceName=${encodeURIComponent(reqBody.workspaceName || "Unknown Workspace")}`;

  // Audit Log
  createTamperEvidentLog({
    userId: auth.userId,
    action: "user.login_cli_sso",
    entity: "user",
    entityId: auth.userId,
    workspaceId: workspaceId,
    changes: { method: "sso" }
  }).catch(err => console.error("SSO audit failed:", err));

  return NextResponse.json({ redirectUrl: redirectTarget });
}
