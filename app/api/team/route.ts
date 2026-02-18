import { getServerSession } from "next-auth";
import { authOptions } from "./../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { DAILY_LIMITS, Tier } from "@/lib/rate-limit-config";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user with tier
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
    } = await req.json();

    if (!workspaceId) {
        return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // Permission Check: Owner or Admin of the workspace
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(session.user.id, workspaceId);

    if (!role || (role !== "owner" && role !== "admin")) {
        return NextResponse.json({ 
            error: "Only workspace owners and admins can create teams.",
            message: "You do not have permission to create teams in this workspace."
        }, { status: 403 });
    }

    const createTeam = await prisma.team.findFirst({
      where: { AND: [{ name: name }, { createdBy: user.id }, { workspaceId: workspaceId }] },
    });
    console.log("Existing team check:", createTeam);

    if (createTeam) {
      return NextResponse.json({ error: "Already Exists" }, { status: 409 });
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        teamColor: teamColor || "blue",
        createdAt: new Date(),
        createdBy: session.user.id,
        workspaceId,
        roles,
        
        members: {
          create: {
            userId: session.user.id,
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

    console.log("Team created in DB:", team);

    // Notify user
    try {
        await createNotification(
          session.user.id,
          session.user.email,
          "Team Created",
          `Team "${team.name}" created`,
          `You successfully created team "${team.name}".`,
          "success"
        );
        console.log("Notification created successfully");
    } catch (notifError) {
        console.error("Failed to create notification:", notifError);
    }

    return NextResponse.json(team, { status: 201 });
  } catch (error: any) {
    console.error("POST /team error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspaceId");

    const whereClause: any = {
        members: {
          some: {
            userId: session.user.id,
          },
        },
    };

    if (workspaceId) {
        whereClause.workspaceId = workspaceId;
    }

    const getTeamData = await prisma.team.findMany({
      where: whereClause,
      include:{
        teamProjects:true,
        members:true
      }
    });

    return NextResponse.json(getTeamData, { status: 200 });
  } catch (error: any) {
    console.error("GET /team error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await req.json();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { workspaceId: true, createdBy: true }
    });

    if (!team) {
       return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Permission Check
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    // We need workspaceId, finding it from the team
    if (!team.workspaceId) {
        return NextResponse.json({ error: "Team not linked to a workspace" }, { status: 400 });
    }
    const role = await getUserWorkspaceRole(session.user.id, team.workspaceId);
    
    // Also allow if the user is the direct creator (though creator should be owner usually)
    const isCreator = team.createdBy === session.user.id;

    if (!isCreator && (!role || (role !== "owner" && role !== "admin"))) {
        return NextResponse.json({ 
            error: "Only workspace owners and admins can delete teams.", 
             message: "You do not have permission to delete this team."
        }, { status: 403 });
    }

    const deleteTeam = await prisma.team.delete({
      where: {
        id: teamId,
      },
    });

    // Notify user
    await createNotification(
      session.user.id,
      session.user.email,
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
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, name, description } = await req.json();

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
    const role = await getUserWorkspaceRole(session.user.id, team.workspaceId);
    const isCreator = team.createdBy === session.user.id;

    if (!isCreator && (!role || (role !== "owner" && role !== "admin"))) {
        return NextResponse.json({ error: "Only workspace owners and admins can update teams." }, { status: 403 });
    }

    const updateTeam = await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(updateTeam, { status: 200 });
  } catch (error: any) {
    console.error("PUT /team error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
