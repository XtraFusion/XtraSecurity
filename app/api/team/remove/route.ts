import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const { memberId } = await req.json();
    const deleteMember = await prisma.teamUser.deleteMany({
      where: {
        id: memberId,
      },
    });
    return NextResponse.json(
      { message: "Member removed successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error removing member" },
      { status: 500 }
    );
  }
}
