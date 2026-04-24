import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

const LINEAR_API = "https://api.linear.app/graphql";

async function getLinearCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "linear" } },
  });
  if (!integration?.accessToken) return null;
  try {
    return decrypt(JSON.parse(integration.accessToken));
  } catch { return null; }
}

// GET /api/integrations/linear/sync - List teams
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const key = await getLinearCreds(auth.userId);
    if (!key) return NextResponse.json({ error: "Linear not connected" }, { status: 400 });

    const query = { query: `query { teams { nodes { id name key } } }` };
    const res = await axios.post(LINEAR_API, query, {
      headers: { "Authorization": key },
      timeout: 8000,
    });

    const repos = (res.data?.data?.teams?.nodes || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      fullName: t.key,
      owner: "Team",
      private: true,
      url: `https://linear.app/team/${t.key}`,
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/linear/sync - Create Issue
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, message, severity, targetId } = await req.json(); // targetId is teamId
    const key = await getLinearCreds(auth.userId);
    if (!key) return NextResponse.json({ error: "Linear not connected" }, { status: 400 });

    const priority = severity === "critical" ? 1 : severity === "error" ? 2 : severity === "warning" ? 3 : 4;

    const mutation = {
      query: `mutation ($teamId: String!, $title: String!, $description: String!, $priority: Int!) {
        issueCreate(input: { teamId: $teamId, title: $title, description: $description, priority: $priority }) {
          success
          issue { id url }
        }
      }`,
      variables: { teamId: targetId, title: `[XtraSecurity] ${title}`, description: message || "", priority }
    };

    const res = await axios.post(LINEAR_API, mutation, {
      headers: { "Authorization": key },
      timeout: 8000,
    });

    if (res.data?.data?.issueCreate?.success === false) throw new Error("Issue creation failed");

    return NextResponse.json({ success: true, summary: { total: 1, synced: 1, failed: 0 }, results: [{ key: "linear_issue", success: true }] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
