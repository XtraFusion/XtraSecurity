import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(req);
  if (!auth || !auth.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: auth.email },
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
