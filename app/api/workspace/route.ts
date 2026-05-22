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
    const { name, description = "", workspaceType = "personal" } = body;
    // subscriptionPlan, projectLimit, subscriptionEnd are NOT user-settable

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        workspaceType,
        createdBy: userId,
        subscriptionPlan: "free",
        projectLimit: 5,
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
    const { id, name, description, workspaceType, icon } = body;
    // NOTE: subscriptionPlan, projectLimit, subscriptionEnd are NOT user-editable.
    // They must be set by the payment/billing system only.

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

    // Cascade delete manually
    const projects = await prisma.project.findMany({ where: { workspaceId: id }, select: { id: true } });
    const projectIds = projects.map(p => p.id);

    if (projectIds.length > 0) {
      const secrets = await prisma.secret.findMany({ where: { projectId: { in: projectIds } }, select: { id: true } });
      const secretIds = secrets.map(s => s.id);
      
      if (secretIds.length > 0) {
        await prisma.secretSync.deleteMany({ where: { secretId: { in: secretIds } } });
        await prisma.secretShare.deleteMany({ where: { secretId: { in: secretIds } } });
        
        const schedules = await prisma.rotationSchedule.findMany({ where: { secretId: { in: secretIds } }, select: { id: true } });
        const scheduleIds = schedules.map(s => s.id);
        if (scheduleIds.length > 0) {
           await prisma.rotationLog.deleteMany({ where: { scheduleId: { in: scheduleIds } } });
           await prisma.rotationSchedule.deleteMany({ where: { id: { in: scheduleIds } } });
        }
        
        // Remove sourceSecretId references first to avoid foreign key issues
        await prisma.secret.updateMany({
            where: { projectId: { in: projectIds } },
            data: { sourceSecretId: null }
        });
        await prisma.secret.deleteMany({ where: { projectId: { in: projectIds } } });
      }

      await prisma.branch.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.teamProject.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.serviceAccount.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.webhook.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.accessRequest.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.userRole.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.breakGlassSession.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.jitLink.deleteMany({ where: { projectId: { in: projectIds } } });
      
      await prisma.project.deleteMany({ where: { workspaceId: id } });
    }

    const teams = await prisma.team.findMany({ where: { workspaceId: id }, select: { id: true } });
    const teamIds = teams.map(t => t.id);
    if (teamIds.length > 0) {
      await prisma.teamUser.deleteMany({ where: { teamId: { in: teamIds } } });
      await prisma.teamSSO.deleteMany({ where: { teamId: { in: teamIds } } });
      await prisma.team.deleteMany({ where: { workspaceId: id } });
    }

    await prisma.apiKey.deleteMany({ where: { workspaceId: id } });
    await prisma.auditLog.deleteMany({ where: { workspaceId: id } });
    await prisma.notification.deleteMany({ where: { workspaceId: id } });
    await prisma.notificationRule.deleteMany({ where: { workspaceId: id } });
    await prisma.notificationChannel.deleteMany({ where: { workspaceId: id } });
    await prisma.securityEvent.deleteMany({ where: { workspaceId: id } });
    await prisma.jitLink.deleteMany({ where: { workspaceId: id } });
    await prisma.accessRequest.deleteMany({ where: { workspaceId: id } });

    await prisma.workspace.delete({ where: { id } });

    return NextResponse.json({ message: "Workspace deleted" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
});
