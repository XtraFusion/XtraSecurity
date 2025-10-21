import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/project/[id]/teams
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const projectTeams = await prisma.teamProject.findMany({
      where: {
        projectId: params.id,
      },
      include: {
        team: true,
      },
    });

    return NextResponse.json(projectTeams);
  } catch (error) {
    console.error("[PROJECT_TEAMS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/project/[id]/teams
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { teamId } = body;

    // Check if user has permission to add team to project
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { teamProjects: true },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    if (project.userId !== session.user.id) {
      // Check if user is admin of the team
      const userTeam = await prisma.teamUser.findFirst({
        where: {
          teamId: teamId,
          userId: session.user.id,
          role: "owner",
        },
      });

      if (!userTeam) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const teamProject = await prisma.teamProject.create({
      data: {
        teamId,
        projectId: params.id,
      },
      include: {
        team: true,
      },
    });

    return NextResponse.json(teamProject);
  } catch (error) {
    console.error("[PROJECT_TEAMS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/project/[id]/teams/[teamProjectId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; teamProjectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const teamProject = await prisma.teamProject.delete({
      where: {
        id: params.teamProjectId,
        projectId: params.id,
      },
    });

    return NextResponse.json(teamProject);
  } catch (error) {
    console.error("[PROJECT_TEAMS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}