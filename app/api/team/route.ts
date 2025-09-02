import { getServerSession } from "next-auth";
import { authOptions } from "./../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      description,
      teamColor,
      roles = [],
      members = [],
      teamProjects = [],
    } = await req.json();

    const createTeam = await prisma.team.findFirst({
      where: { AND: [{ name: name }, { createdBy: session.user.id }] },
    });
    console.log(createTeam)

    if (createTeam) {
      return NextResponse.json({ error: "Already Exists" }, { status: 409 });
    }

    await prisma.team.create({
      data: {
        name,
        description,
        teamColor: teamColor || "blue",
        createdAt: new Date(),
        createdBy: session.user.id,
        roles,
        members: {
          create: {
            userId: session.user.id,
            role: "admin",
          },
        },
      },
    });

    return NextResponse.json({ message: "Invitation sent" }, { status: 200 });
  } catch (error: any) {
    console.error("POST /team error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const getTeamData = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
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

    const deleteTeam = await prisma.team.deleteMany({
      where: {
        id: teamId,
        createdBy: session.user.id,
      },
    });

    if (!deleteTeam.count) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

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

    const updateTeam = await prisma.team.update({
      where: {
        id: teamId,
        createdBy: session.user.id,
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
