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

    const teamWorkspaces = await prisma.workspace.findMany({
      where: { 
        id: { in: teamWorkspaceIds },
        createdBy: { not: userId } // Avoid duplicates if user is owner and in a team
      },
    });

    // 3. Combine and attach roles
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    
    const allWorkspaces = [...ownedWorkspaces, ...teamWorkspaces];
    const workspacesWithRoles = await Promise.all(
      allWorkspaces.map(async (ws) => {
        const role = await getUserWorkspaceRole(userId, ws.id);
        return {
          ...ws,
          role: role || "viewer"
        };
      })
    );

    return NextResponse.json({ workspaces: workspacesWithRoles });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 });
  }
});

// POST /api/workspace - create a new workspace
export const POST = withSecurity(async (request: NextRequest, context: any, session: any) => {
  try {
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const body = await request.json();
    const { name, description, workspaceType = "personal" } = body;

    const { validateWorkspaceName, validateDescription } = await import("@/lib/validators");
    const nameCheck = validateWorkspaceName(name);
    if (!nameCheck.valid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }
    const descCheck = validateDescription(description);
    if (!descCheck.valid) {
      return NextResponse.json({ error: descCheck.error }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true }
    });

    const userTier = (user?.tier || "free") as Tier;
    const limit = DAILY_LIMITS[userTier].maxWorkspaces;
    
    const initialCount = await prisma.workspace.count({
      where: { createdBy: userId }
    });

    if (initialCount >= limit) {
      return NextResponse.json({ 
        error: "Workspace limit reached", 
        message: `Your ${userTier} plan allows creating up to ${limit} workspaces. Please upgrade for more capacity.` 
      }, { status: 403 });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: nameCheck.cleanName!,
        description: descCheck.cleanDesc || "",
        workspaceType,
        createdBy: userId,
        subscriptionPlan: "free",
        projectLimit: 5,
      },
    });

    // Concurrency guard: If parallel race requests created workspaces exceeding limit, clean up excess
    const allUserWorkspaces = await prisma.workspace.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: "asc" },
      select: { id: true }
    });

    if (allUserWorkspaces.length > limit) {
      const createdIndex = allUserWorkspaces.findIndex(w => w.id === workspace.id);
      if (createdIndex >= limit) {
        await prisma.workspace.delete({ where: { id: workspace.id } }).catch(() => {});
        return NextResponse.json({ 
          error: "Workspace limit reached", 
          message: `Your ${userTier} plan allows creating up to ${limit} workspaces. Please upgrade for more capacity.` 
        }, { status: 403 });
      }
    }

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
    const { id, name, description, workspaceType, icon } = body;

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
      },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error updating workspace:", error);
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }
});

// DELETE /api/workspace - delete a workspace
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

    // RBAC Check
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(userId, id);

    if (role !== "owner") {
         return NextResponse.json({ error: "Only the workspace owner can delete the workspace" }, { status: 403 });
    }

    // 1. Delete associated projects (and their branches/secrets)
    const projects = await prisma.project.findMany({
      where: { workspaceId: id },
    });

    for (const project of projects) {
      await prisma.secret.deleteMany({ where: { projectId: project.id } });
      await prisma.branch.deleteMany({ where: { projectId: project.id } });
      await prisma.project.delete({ where: { id: project.id } });
    }

    // 2. Delete associated teams
    const teams = await prisma.team.findMany({
      where: { workspaceId: id }
    });
    for (const team of teams) {
      await prisma.teamUser.deleteMany({ where: { teamId: team.id } });
      await prisma.teamProject.deleteMany({ where: { teamId: team.id } });
      await prisma.team.delete({ where: { id: team.id } });
    }

    // 3. Delete workspace
    await prisma.workspace.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
});
