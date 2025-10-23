import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, provider, config } = await req.json();

    // Basic persistence of SSO config - no validation for now
    const existing = await prisma.teamSSO.findFirst({ where: { teamId } });
    if (existing) {
      const updated = await prisma.teamSSO.update({ where: { id: existing.id }, data: { provider, config } as any });
      return NextResponse.json({ sso: updated }, { status: 200 });
    }

    const created = await prisma.teamSSO.create({ data: { teamId, provider, config: config as any } as any });
    return NextResponse.json({ sso: created }, { status: 201 });
  } catch (error) {
    console.error("Error saving SSO config:", error);
    return NextResponse.json({ error: "Failed to save SSO config" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });

    const sso = await prisma.teamSSO.findFirst({ where: { teamId } });
    return NextResponse.json({ sso }, { status: 200 });
  } catch (error) {
    console.error("Error fetching SSO config:", error);
    return NextResponse.json({ error: "Failed to fetch SSO config" }, { status: 500 });
  }
}
