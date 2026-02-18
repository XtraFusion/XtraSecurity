import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  
  // Ensure the key belongs to the user
  const count = await prisma.apiKey.count({
    where: {
      id: params.id,
      userId: user.id,
    },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Key not found or unauthorized" }, { status: 404 });
  }

  await prisma.apiKey.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
