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

  const whereClause: any = { userId: session.user.id };
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, read } = await req.json();
    if (!id) return NextResponse.json({ error: "Notification id required" }, { status: 400 });

    // Verify ownership
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    
    if (notification.userId !== session.user.id) {
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
