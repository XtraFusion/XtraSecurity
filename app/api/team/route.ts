import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withSecurity } from "@/lib/api-middleware";
import { createNotification } from "@/lib/notifications";
import { DAILY_LIMITS, Tier } from "@/lib/rate-limit-config";
import { createTamperEvidentLog } from "@/lib/audit";

export const POST = withSecurity(async (request: NextRequest, context: any, session: any) => {
  try {
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;
    const userEmail = session.email;

    // Fetch user with tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tier: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check team limit
    const userTier = (user.tier || "free") as Tier;
    const limit = DAILY_LIMITS[userTier].maxTeams;
    
    const teamCount = await prisma.team.count({
      where: { createdBy: user.id }
    });

    if (teamCount >= limit) {
      return NextResponse.json({ 
        error: "Team limit reached", 
        message: `Your ${userTier} plan allows creating up to ${limit} teams. Please upgrade for more capacity.` 
      }, { status: 403 });
    }

    const {
      name,
      description,
      teamColor,
      roles = [],
      members = [],
      teamProjects = [],
      workspaceId,
    } = await request.json();

    if (!workspaceId) {
        return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // Permission Check: Owner or Admin of the workspace
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(userId, workspaceId);

    if (!role || (role !== "owner" && role !== "admin")) {
        return NextResponse.json({ 
            error: "Only workspace owners and admins can create teams.",
            message: "You do not have permission to create teams in this workspace."
        }, { status: 403 });
    }

    const createTeam = await prisma.team.findFirst({
      where: { AND: [{ name: name }, { createdBy: user.id }, { workspaceId: workspaceId }] },
    });

    if (createTeam) {
      return NextResponse.json({ error: "Already Exists" }, { status: 409 });
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        teamColor: teamColor || "blue",
        createdAt: new Date(),
        createdBy: userId,
        workspaceId,
        roles,
        members: {
          create: {
            userId: userId,
            role: "admin",
            status: "active",
          },
        },
      },
      include: {
        members: true,
        teamProjects: true,
      },
    });

    // Notify user
    try {
        await createNotification(
          userId,
          userEmail!,
          "Team Created",
          `Team "${team.name}" created`,
          `You successfully created team "${team.name}".`,
          "success"
        );
    } catch (notifError) {
        console.error("Failed to create notification:", notifError);
    }

    // Audit Log
    await createTamperEvidentLog({
      userId: userId,
      action: "team.create",
      entity: "team",
      entityId: team.id,
      workspaceId: workspaceId,
      changes: { name: team.name }
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error: any) {
    console.error("POST /team error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
});

export const GET = withSecurity(async (request: NextRequest, context: any, session: any) => {
  try {
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId");

    const whereClause: any = {
        members: {
          some: {
            userId: userId,
          },
        },
    };

    if (workspaceId) {
        whereClause.workspaceId = workspaceId;
    }

    // Fetch teams
    const getTeamData = await prisma.team.findMany({
      where: whereClause,
      include:{
        teamProjects:true,
        members:true
      }
    });

    // Check permissions if workspaceId is present
    let isRestricted = true;
    if (workspaceId) {
        const { getUserWorkspaceRole } = await import("@/lib/permissions");
        const role = await getUserWorkspaceRole(userId, workspaceId);
        if (role === 'owner' || role === 'admin') {
            isRestricted = false;
        }
    }

    // If restricted (member/viewer or no workspace specified), filter members
    if (isRestricted) {
        getTeamData.forEach((team: any) => {
             team.members = team.members.filter((m: any) => 
                m.role === 'owner' || m.userId === userId
             );
        });
    }

    return NextResponse.json(getTeamData, { status: 200 });
  } catch (error: any) {
    console.error("GET /team error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
});

export const DELETE = withSecurity(async (request: NextRequest, context: any, session: any) => {
  try {
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;
    const userEmail = session.email;

    const { teamId } = await request.json();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { workspaceId: true, createdBy: true }
    });

    if (!team) {
       return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Permission Check
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    if (!team.workspaceId) {
        return NextResponse.json({ error: "Team not linked to a workspace" }, { status: 400 });
    }
    const role = await getUserWorkspaceRole(userId, team.workspaceId);
    
    const isCreator = team.createdBy === userId;

    if (!isCreator && (!role || (role !== "owner" && role !== "admin"))) {
        return NextResponse.json({ 
            error: "Only workspace owners and admins can delete teams.", 
             message: "You do not have permission to delete this team."
        }, { status: 403 });
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    // Notify user
    await createNotification(
      userId,
      userEmail!,
      "Team Deleted",
      "Team deleted", 
      "The team has been successfully deleted.",
      "warning"
    );

    return NextResponse.json({ message: "Team deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /team error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
});

export const PUT = withSecurity(async (request: NextRequest, context: any, session: any) => {
  try {
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const { teamId, name, description } = await request.json();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { workspaceId: true, createdBy: true }
    });

    if (!team) {
       return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Permission Check
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    if (!team.workspaceId) {
        return NextResponse.json({ error: "Team not linked to a workspace" }, { status: 400 });
    }
    const role = await getUserWorkspaceRole(userId, team.workspaceId);
    const isCreator = team.createdBy === userId;

    if (!isCreator && (!role || (role !== "owner" && role !== "admin"))) {
        return NextResponse.json({ error: "Only workspace owners and admins can update teams." }, { status: 403 });
    }

    const updateTeam = await prisma.team.update({
      where: { id: teamId },
      data: { name, description },
    });

    return NextResponse.json(updateTeam, { status: 200 });
  } catch (error: any) {
    console.error("PUT /team error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
});
