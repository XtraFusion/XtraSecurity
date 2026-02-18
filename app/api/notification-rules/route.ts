import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");

  const filter: any = {};
  if (workspaceId) filter.workspaceId = workspaceId;

  const result = await (prisma as any).$runCommandRaw({
    find: "NotificationRule",
    filter,
    sort: { createdAt: -1 },
  });

  const rules = (result?.cursor?.firstBatch ?? []).map((r: any) => ({
    ...r,
    id: r._id?.$oid ?? r._id,
    createdAt: r.createdAt?.$date ?? r.createdAt,
    updatedAt: r.updatedAt?.$date ?? r.updatedAt,
  }));

  return NextResponse.json({ rules }, { status: 200 });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, triggers, channels, conditions, workspaceId } = body;

  if (!name || !triggers?.length) {
    return NextResponse.json({ error: "Name and triggers are required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const doc = {
    name,
    description: description || "",
    triggers,
    channels: channels || [],
    conditions: conditions || {},
    createdBy: session.user.email || session.user.id,
    workspaceId: workspaceId || null,
    enabled: true,
    createdAt: { $date: now },
    updatedAt: { $date: now },
  };

  const result = await (prisma as any).$runCommandRaw({
    insert: "NotificationRule",
    documents: [doc],
  });

  const insertedId = result?.insertedIds?.[0]?.$oid ?? result?.insertedIds?.[0];
  return NextResponse.json({ rule: { ...doc, id: insertedId, createdAt: now, updatedAt: now } }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const now = new Date().toISOString();
  await (prisma as any).$runCommandRaw({
    update: "NotificationRule",
    updates: [
      {
        q: { _id: { $oid: id } },
        u: { $set: { ...data, updatedAt: { $date: now } } },
      },
    ],
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await (prisma as any).$runCommandRaw({
    delete: "NotificationRule",
    deletes: [{ q: { _id: { $oid: id } }, limit: 1 }],
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
