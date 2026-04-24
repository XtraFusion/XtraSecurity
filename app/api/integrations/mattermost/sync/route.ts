import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getMattermostCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "mattermost" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, url: cfg.url };
  } catch { return null; }
}

// GET /api/integrations/mattermost/sync - Lists
export async function GET(req: NextRequest) {
  return NextResponse.json({ repos: [{ id: "mattermost", name: "Incident Response", fullName: "Mattermost Channel", owner: "Registry", private: true, url: "#" }] });
}

// POST /api/integrations/mattermost/sync - Pulse
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await getMattermostCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Mattermost not connected" }, { status: 400 });

    const { projectId } = await req.json();
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    // Mattermost post
    try {
      // Find a public channel to post to
      const channelsRes = await axios.get(`${creds.url}/api/v4/channels`, { headers: { "Authorization": `Bearer ${creds.token}` } });
      const channelId = channelsRes.data[0]?.id;

      if (channelId) {
        await axios.post(`${creds.url}/api/v4/posts`, {
          channel_id: channelId,
          message: `### 🔐 XtraSecurity Notification\nProject **${project?.name}** has completed a secrets synchronization cycle.`
        }, { headers: { "Authorization": `Bearer ${creds.token}` } });
      }
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
