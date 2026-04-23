import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withSecurity } from "@/lib/api-middleware";
import { DAILY_LIMITS, Tier } from "@/lib/rate-limit-config";

// GET /api/workspace - list workspaces or fetch by id
export const GET = withSecurity(async (request: NextRequest, context: any, session: any) => {
  try {
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const { getUserWorkspaceRole } = await import("@/lib/permissions");
      const role = await getUserWorkspaceRole(userId, id);
      
      if (!role) {
           return NextResponse.json({ error: "Workspace not found or access denied" }, { status: 404 });
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: { projects: true },
      });

      return NextResponse.json({
        ...workspace,
        role: role
      });
    }

    // 1. Get workspaces created by user
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { createdBy: userId },
    });

    // 2. Get workspaces where user is a team member
    const userTeams = await prisma.teamUser.findMany({
      where: { 
        userId: userId,
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
        NOT: { createdBy: userId }
      },
    });

    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const allWorkspaces = await Promise.all([...ownedWorkspaces, ...memberWorkspaces].map(async (w) => {
      const role = await getUserWorkspaceRole(userId, w.id);
      return { ...w, role };
    }));

    return NextResponse.json(allWorkspaces);
  } catch (error) {
    console.error("Error fetching workspace(s):", error);
    return NextResponse.json({ error: "Failed to fetch workspace(s)" }, { status: 500 });
  }
});

// POST /api/workspace - create a workspace
export const POST = withSecurity(async (request: NextRequest, context: any, session: any) => {
  try {
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    // Fetch user with tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true }
    });

    const userTier = (user?.tier || "free") as Tier;
    const limit = DAILY_LIMITS[userTier].maxWorkspaces;
    
    const workspaceCount = await prisma.workspace.count({
      where: { createdBy: userId }
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
        createdBy: userId,
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
});

// PUT /api/workspace - update a workspace
export const PUT = withSecurity(async (request: NextRequest, context: any, session: any) => {
  try {
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const body = await request.json();
    const { id, name, description, workspaceType, subscriptionPlan, projectLimit, subscriptionEnd, icon } = body;

    if (!id) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // RBAC Check
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(userId, id);

    if (!role || (role !== "owner" && role !== "admin")) {
         return NextResponse.json({ error: "Only workspace owners and admins can update settings" }, { status: 403 });
    }

    const existing = await prisma.workspace.findUnique({ where: { id } });
    if (!existing) {
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
});

// DELETE /api/workspace?id=<id> - delete a workspace
export const DELETE = withSecurity(async (request: NextRequest, context: any, session: any) => {
  try {
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // RBAC Check: Only Owner can delete
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(userId, id);

    if (role !== "owner") {
         return NextResponse.json({ error: "Only the workspace owner can delete the workspace" }, { status: 403 });
    }

    await prisma.workspace.delete({ where: { id } });

    return NextResponse.json({ message: "Workspace deleted" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
});
