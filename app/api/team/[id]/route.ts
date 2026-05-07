import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
const {id} = await params;
    const auth = await verifyAuth(req);
    if (!auth?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await prisma.team.findUnique({
      where: { id: id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    if (data) {
      // Check current user's role in the team
      const myMembership = data.members.find(
        (m) => m.user.id === auth.userId
      );

      // If they are only a viewer, restrict visibility of other members
      if (myMembership?.role === "viewer") {
        data.members = data.members.filter(
          (m) =>
            m.role === "owner" ||
            m.role === "admin" ||
            m.user.id === auth.userId
        );
      }
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("GET /team error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
