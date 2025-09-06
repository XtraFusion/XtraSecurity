import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { teamId, status = "active" } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (status === "accept") {
      const acceptInvite = await prisma.teamUser.update({
        where: {
          id: teamId,
        },
        data: {
          status,
        },
      });

      return NextResponse.json(
        { message: "Invitation accepted", acceptInvite },
        { status: 200 }
      );
    }

    if (status === "decline") {
      const deleteTeamUser = await prisma.teamUser.delete({
        where: {
          teamId_userId: {
            teamId,
            userId: session.user.id,
          },
        },
      });

      return NextResponse.json(
        { message: "Invitation rejected", deleteTeamUser },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid status value" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /team/invite/response error:", error);

    // Handle Prisma record not found
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
