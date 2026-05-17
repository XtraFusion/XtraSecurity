
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";

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
      where: { id: params.teamProjectId },
      include: { project: true, team: true }
  });

  if (!assignment || assignment.projectId !== params.id) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  await prisma.teamProject.delete({
      where: { id: params.teamProjectId }
  });

  try { await logAudit("PROJECT_TEAM_REMOVED", auth.userId, params.id, { teamId: assignment.teamId, teamName: assignment.team.name }, assignment.project.workspaceId || undefined); } catch (auditErr) { console.error("Failed to write audit log:", auditErr); } return NextResponse.json({ success: true });
}
