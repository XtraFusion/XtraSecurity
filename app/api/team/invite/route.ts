import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { member } = await req.json();
    const { teamId, email, role } =member
console.log(teamId, email, role);
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
where: { email: email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const invite = await prisma.teamUser.create({
      data: {
        teamId,
        userId: user.id,
        role,
        status: "pending",
      },
    });

    return NextResponse.json(
      { message: "Invitation sent", invite },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST /team/invite error:", error);

    // Handle known Prisma errors (optional)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User already invited to this team" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
