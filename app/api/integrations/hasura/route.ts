import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

const HASURA_API = "https://api.hasura.io/v1/graphql";

// GET /api/integrations/hasura - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "hasura" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, username: integration.username, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/hasura - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { personalAccessToken } = await req.json();
    if (!personalAccessToken) return NextResponse.json({ error: "Personal Access Token is required" }, { status: 400 });

    const headers = { "Authorization": `Bearer ${personalAccessToken}`, "Content-Type": "application/json" };

    try {
      // Validate by fetching user details via GraphQL
      const query = { query: `query { me { id email name } }` };
      const res = await axios.post(HASURA_API, query, { headers, timeout: 8000 });
      
      if (res.data?.errors) throw new Error("Invalid Token");
      
      const username = res.data?.data?.me?.name || res.data?.data?.me?.email || "Hasura User";
      const encrypted = encrypt(personalAccessToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "hasura" } },
        create: { userId: auth.userId, provider: "hasura", accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
        update: { accessToken: JSON.stringify(encrypted), username, status: "connected", enabled: true },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "Hasura Cloud authentication failed" }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/hasura
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "hasura" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
