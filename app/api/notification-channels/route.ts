import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

export async function GET(req: Request) {
  try {
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

    const channels = await prisma.notificationChannel.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ channels }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch notification channels:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    const channel = await prisma.notificationChannel.create({
      data: {
        type,
        name,
        config: config || {},
        workspaceId,
        enabled: true,
      },
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    console.error("Failed to create notification channel:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const channel = await prisma.notificationChannel.findUnique({
      where: { id },
    });
    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    if (channel.workspaceId) {
      const { getUserWorkspaceRole } = await import("@/lib/permissions");
      const role = await getUserWorkspaceRole(auth.userId, channel.workspaceId);
      if (!role || (role !== "owner" && role !== "admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;

    const updated = await prisma.notificationChannel.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, channel: updated }, { status: 200 });
  } catch (error) {
    console.error("Failed to update notification channel:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const channel = await prisma.notificationChannel.findUnique({
      where: { id },
    });
    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    if (channel.workspaceId) {
      const { getUserWorkspaceRole } = await import("@/lib/permissions");
      const role = await getUserWorkspaceRole(auth.userId, channel.workspaceId);
      if (!role || (role !== "owner" && role !== "admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.notificationChannel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete notification channel:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
