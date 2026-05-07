import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

export async function GET(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integrations = await prisma.integration.findMany({ where: { createdBy: auth.email } });
    return NextResponse.json({ integrations }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch integrations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { provider, config } = body;

    const created = await prisma.integration.create({
      data: {
        provider,
        enabled: true,
        status: "connected",
        config: config as any,
        createdBy: auth.email || "",
      },
    });

    return NextResponse.json({ integration: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create integration" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const count = await prisma.integration.deleteMany({ 
        where: { 
            id, 
            createdBy: auth.email || "" 
        } 
    });

    if (count.count === 0) {
        return NextResponse.json({ error: "Integration not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
