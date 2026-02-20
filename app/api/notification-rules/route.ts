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

  if (!workspaceId) {
       return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
  }

  // RBAC: Check if user has access to workspace
  const { getUserWorkspaceRole } = await import("@/lib/permissions");
  const role = await getUserWorkspaceRole(session.user.id, workspaceId);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filter: any = { workspaceId };

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

  if (!name || !triggers?.length || !workspaceId) {
    return NextResponse.json({ error: "Name, triggers, and workspaceId are required" }, { status: 400 });
  }

  // RBAC: Only Admin/Owner
  const { getUserWorkspaceRole } = await import("@/lib/permissions");
  const role = await getUserWorkspaceRole(session.user.id, workspaceId);
  if (!role || (role !== "owner" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden: Only admins can manage rules" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const doc = {
    name,
    description: description || "",
    triggers,
    channels: channels || [],
    conditions: conditions || {},
    createdBy: session.user.email || session.user.id,
    workspaceId,
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

  // Pre-check: Fetch rule to get workspaceId
  // Since we use mongo command, we have to find it first.
  const findResult: any = await (prisma as any).$runCommandRaw({
      find: "NotificationRule",
      filter: { _id: { $oid: id } },
      limit: 1
  });
  
  const rule = findResult?.cursor?.firstBatch?.[0];
  if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

  // RBAC
  const { getUserWorkspaceRole } = await import("@/lib/permissions");
  const role = await getUserWorkspaceRole(session.user.id, rule.workspaceId);
  if (!role || (role !== "owner" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  // RBAC Check
  const findResult: any = await (prisma as any).$runCommandRaw({
      find: "NotificationRule",
      filter: { _id: { $oid: id } },
      limit: 1
  });
  
  const rule = findResult?.cursor?.firstBatch?.[0];
  if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

  const { getUserWorkspaceRole } = await import("@/lib/permissions");
  const role = await getUserWorkspaceRole(session.user.id, rule.workspaceId);
  if (!role || (role !== "owner" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await (prisma as any).$runCommandRaw({
    delete: "NotificationRule",
    deletes: [{ q: { _id: { $oid: id } }, limit: 1 }],
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
