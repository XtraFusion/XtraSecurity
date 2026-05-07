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

  const whereClause: any = { userId: auth.userId };
  if (workspaceId) {
      whereClause.workspaceId = workspaceId;
  }

  const notifications = await prisma.notification.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notifications }, { status: 200 });
}

export async function PATCH(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, read } = await req.json();
    if (!id) return NextResponse.json({ error: "Notification id required" }, { status: 400 });

    // Verify ownership
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    
    if (notification.userId !== auth.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: !!read },
    });

    return NextResponse.json({ notification: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Notification id required" }, { status: 400 });

    // Verify ownership before deleting
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    if (notification.userId !== auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.notification.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
