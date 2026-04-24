import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import { JWT } from "google-auth-library";
import axios from "axios";

async function getDriveCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "googledrive" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const sa = decrypt(JSON.parse(integration.accessToken));
    return JSON.parse(sa);
  } catch { return null; }
}

// GET /api/integrations/googledrive/sync - Status
export async function GET(req: NextRequest) {
  return NextResponse.json({ repos: [{ id: "drive", name: "Encrypted Cloud Backup", fullName: "Google Drive Storage", owner: "Personal", private: true, url: "#" }] });
}

// POST /api/integrations/googledrive/sync - Create Backup
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId } = await req.json();
    const sa = await getDriveCreds(auth.userId);
    if (!sa) return NextResponse.json({ error: "Drive not connected" }, { status: 400 });

    const secrets = await prisma.secret.findMany({ where: { projectId } });
    const backupContent = JSON.stringify(secrets, null, 2);

    const client = new JWT({ email: sa.client_email, key: sa.private_key, scopes: ["https://www.googleapis.com/auth/drive.file"] });
    const { token } = await client.getAccessToken();
    const headers = { "Authorization": `Bearer ${token}` };

    // Upload file
    const metadata = { name: `xtrasecurity-backup-${Date.now()}.json`, mimeType: "application/json" };
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", new Blob([backupContent], { type: "application/json" }));

    await axios.post("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", form, { headers });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
