import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { DAILY_LIMITS, Tier } from "@/lib/rate-limit-config";

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
      // Security Check: User must be member/owner using getUserWorkspaceRole (which checks teams/ownership)
      const { getUserWorkspaceRole } = await import("@/lib/permissions");
      const role = await getUserWorkspaceRole(session.user.id, id);
      
      if (!role) {
           return NextResponse.json({ error: "Workspace not found or access denied" }, { status: 404 });
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: { projects: true },
      });
      // Logic for getUserWorkspaceRole confirms existence and access, so workspace should exist if role exists
      // unless race condition
      return NextResponse.json(workspace);
    }

    // 1. Get workspaces created by user
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { createdBy: session.user.id },
    });

    // 2. Get workspaces where user is a team member
    // discrete query because Workspace -> Team relation is missing in schema
    const userTeams = await prisma.teamUser.findMany({
      where: { 
        userId: session.user.id,
        status: "active" 
      },
      select: { teamId: true }
    });
    
    const teamIds = userTeams.map(ut => ut.teamId);
    
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { workspaceId: true }
    });

    const teamWorkspaceIds = teams
      .map(t => t.workspaceId)
      .filter((id): id is string => !!id);

    const memberWorkspaces = await prisma.workspace.findMany({
      where: { 
        id: { in: teamWorkspaceIds },
        // Avoid duplicates if user is both owner and member (rare but possible)
        NOT: { createdBy: session.user.id }
      },
    });

    const allWorkspaces = [...ownedWorkspaces, ...memberWorkspaces];

    return NextResponse.json(allWorkspaces);
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

    // Fetch user with tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tier: true }
    });

    const userTier = (user?.tier || "free") as Tier;
    const limit = DAILY_LIMITS[userTier].maxWorkspaces;
    
    const workspaceCount = await prisma.workspace.count({
      where: { createdBy: session.user.id }
    });

    if (workspaceCount >= limit) {
      return NextResponse.json({ 
        error: "Workspace limit reached", 
        message: `Your ${userTier} plan allows creating up to ${limit} workspaces. Please upgrade for more capacity.` 
      }, { status: 403 });
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
    const { id, name, description, workspaceType, subscriptionPlan, projectLimit, subscriptionEnd, icon } = body;

    if (!id) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // RBAC Check
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(session.user.id, id);

    if (!role || (role !== "owner" && role !== "admin")) {
         return NextResponse.json({ error: "Only workspace owners and admins can update settings" }, { status: 403 });
    }

    const existing = await prisma.workspace.findUnique({ where: { id } });
    if (!existing) {
       // Should rely on role check but safe to keep
       return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        icon: icon !== undefined ? icon : existing.icon,
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

    // RBAC Check: Only Owner can delete
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(session.user.id, id);

    if (role !== "owner") {
         return NextResponse.json({ error: "Only the workspace owner can delete the workspace" }, { status: 403 });
    }

    await prisma.workspace.delete({ where: { id } });

    return NextResponse.json({ message: "Workspace deleted" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
}
