import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// GET /api/workspace - list workspaces or fetch by id
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: { projects: true },
      });
      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      return NextResponse.json(workspace);
    }

    const workspaces = await prisma.workspace.findMany({
        where:{createdBy:session.user.id},
      include: { projects: true },
    });

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("Error fetching workspace(s):", error);
    return NextResponse.json({ error: "Failed to fetch workspace(s)" }, { status: 500 });
  }
}

// POST /api/workspace - create a workspace
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description = "", workspaceType = "personal", subscriptionPlan = "free", projectLimit = 5, subscriptionEnd = null } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        workspaceType,
        createdBy: session.user.id,
        subscriptionPlan,
        projectLimit,
        subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : undefined,
      },
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}

// PUT /api/workspace - update a workspace
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, workspaceType, subscriptionPlan, projectLimit, subscriptionEnd } = body;

    if (!id) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    const existing = await prisma.workspace.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Optional: restrict who can update (owner/admin). For now allow any authenticated user.

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
        workspaceType: workspaceType ?? existing.workspaceType,
        subscriptionPlan: subscriptionPlan ?? existing.subscriptionPlan,
        projectLimit: projectLimit ?? existing.projectLimit,
        subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : existing.subscriptionEnd,
      },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error updating workspace:", error);
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }
}

// DELETE /api/workspace?id=<id> - delete a workspace
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    const existing = await prisma.workspace.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    await prisma.workspace.delete({ where: { id } });

    return NextResponse.json({ message: "Workspace deleted" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
}
