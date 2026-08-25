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

    // RBAC: Check if user has access to workspace
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(auth.userId, workspaceId);
    if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rules = await prisma.notificationRule.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rules }, { status: 200 });
  } catch (error) {
    console.error("Failed to list notification rules:", error);
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
    const { name, description, triggers, channels, conditions, workspaceId } = body;

    if (!name || !triggers?.length || !workspaceId) {
      return NextResponse.json({ error: "Name, triggers, and workspaceId are required" }, { status: 400 });
    }

    // RBAC: Only Admin/Owner
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(auth.userId, workspaceId);
    if (!role || (role !== "owner" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden: Only admins can manage rules" }, { status: 403 });
    }

    const rule = await prisma.notificationRule.create({
      data: {
        name,
        description: description || "",
        triggers: triggers || [],
        channels: channels || [],
        conditions: conditions || {},
        createdBy: auth.email || auth.userId,
        workspaceId,
        enabled: true,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Failed to create notification rule:", error);
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

    const rule = await prisma.notificationRule.findUnique({
      where: { id },
    });
    if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

    if (rule.workspaceId) {
      const { getUserWorkspaceRole } = await import("@/lib/permissions");
      const role = await getUserWorkspaceRole(auth.userId, rule.workspaceId);
      if (!role || (role !== "owner" && role !== "admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const allowedUpdates: Record<string, any> = {};
    if (typeof data.name === "string") allowedUpdates.name = data.name;
    if (typeof data.description === "string") allowedUpdates.description = data.description;
    if (Array.isArray(data.triggers)) allowedUpdates.triggers = data.triggers;
    if (Array.isArray(data.channels)) allowedUpdates.channels = data.channels;
    if (typeof data.enabled === "boolean") allowedUpdates.enabled = data.enabled;
    if (data.conditions && typeof data.conditions === "object") allowedUpdates.conditions = data.conditions;

    const updated = await prisma.notificationRule.update({
      where: { id },
      data: allowedUpdates,
    });

    return NextResponse.json({ success: true, rule: updated }, { status: 200 });
  } catch (error) {
    console.error("Failed to update notification rule:", error);
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

    const rule = await prisma.notificationRule.findUnique({
      where: { id },
    });
    if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

    if (rule.workspaceId) {
      const { getUserWorkspaceRole } = await import("@/lib/permissions");
      const role = await getUserWorkspaceRole(auth.userId, rule.workspaceId);
      if (!role || (role !== "owner" && role !== "admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.notificationRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete notification rule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
