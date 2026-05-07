import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

export async function GET(req: Request) {
  const auth = await verifyAuth(req);
  if (!auth?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");

  if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
  }

  // RBAC
  const { getUserWorkspaceRole } = await import("@/lib/permissions");
  const role = await getUserWorkspaceRole(auth.userId, workspaceId);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filter: any = { workspaceId };

  const result = await (prisma as any).$runCommandRaw({
    find: "NotificationChannel",
    filter,
    sort: { createdAt: -1 },
  });

  const channels = (result?.cursor?.firstBatch ?? []).map((c: any) => ({
    ...c,
    id: c._id?.$oid ?? c._id,
    createdAt: c.createdAt?.$date ?? c.createdAt,
    updatedAt: c.updatedAt?.$date ?? c.updatedAt,
  }));

  return NextResponse.json({ channels }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = await verifyAuth(req);
  if (!auth?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, name, config, workspaceId } = body;

  if (!name || !type || !workspaceId) {
    return NextResponse.json({ error: "Name, type and workspaceId are required" }, { status: 400 });
  }

  // RBAC
  const { getUserWorkspaceRole } = await import("@/lib/permissions");
  const role = await getUserWorkspaceRole(auth.userId, workspaceId);
  if (!role || (role !== "owner" && role !== "admin")) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const doc = {
    type,
    name,
    config: config || {},
    workspaceId,
    enabled: true,
    createdAt: { $date: now },
    updatedAt: { $date: now },
  };

  const result = await (prisma as any).$runCommandRaw({
    insert: "NotificationChannel",
    documents: [doc],
  });

  const insertedId = result?.insertedIds?.[0]?.$oid ?? result?.insertedIds?.[0];
  return NextResponse.json({ channel: { ...doc, id: insertedId, createdAt: now, updatedAt: now } }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await verifyAuth(req);
  if (!auth?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Pre-fetch for RBAC
  const findResult: any = await (prisma as any).$runCommandRaw({
      find: "NotificationChannel",
      filter: { _id: { $oid: id } },
      limit: 1
  });
  const channel = findResult?.cursor?.firstBatch?.[0];
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const { getUserWorkspaceRole } = await import("@/lib/permissions");
  const role = await getUserWorkspaceRole(auth.userId, channel.workspaceId);
  if (!role || (role !== "owner" && role !== "admin")) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date().toISOString();
  await (prisma as any).$runCommandRaw({
    update: "NotificationChannel",
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
  const auth = await verifyAuth(req);
  if (!auth?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

   // Pre-fetch for RBAC
  const findResult: any = await (prisma as any).$runCommandRaw({
      find: "NotificationChannel",
      filter: { _id: { $oid: id } },
      limit: 1
  });
  const channel = findResult?.cursor?.firstBatch?.[0];
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const { getUserWorkspaceRole } = await import("@/lib/permissions");
  const role = await getUserWorkspaceRole(auth.userId, channel.workspaceId);
  if (!role || (role !== "owner" && role !== "admin")) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await (prisma as any).$runCommandRaw({
    delete: "NotificationChannel",
    deletes: [{ q: { _id: { $oid: id } }, limit: 1 }],
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
