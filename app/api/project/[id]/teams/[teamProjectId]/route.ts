
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; teamProjectId: string } }
) {
  const auth = await verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check permission: Owner or Admin
  const { getUserProjectRole } = await import("@/lib/permissions");
  const role = await getUserProjectRole(auth.userId, params.id);

  if (!role || (role !== 'owner' && role !== 'admin')) {
      return NextResponse.json({ error: "Only project owners and admins can remove teams" }, { status: 403 });
  }

  // Verify the assignment belongs to this project
  const assignment = await prisma.teamProject.findUnique({
      where: { id: params.teamProjectId }
  });

  if (!assignment || assignment.projectId !== params.id) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  await prisma.teamProject.delete({
      where: { id: params.teamProjectId }
  });

  return NextResponse.json({ success: true });
}
