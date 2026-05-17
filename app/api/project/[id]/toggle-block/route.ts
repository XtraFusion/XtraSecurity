import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/db';
import { verifyAuth } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Only project owner can toggle block status
    if (project.userId !== auth.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Toggle block status
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        status: project.status === 'blocked' ? 'active' : 'blocked'
      },
    });

    try { await logAudit(updatedProject.status === 'blocked' ? 'PROJECT_BLOCKED' : 'PROJECT_UNBLOCKED', auth.userId, params.id, { status: updatedProject.status }, project.workspaceId || undefined); } catch (auditErr) { console.error("Failed to write audit log:", auditErr); } return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("[PROJECT_TOGGLE_BLOCK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}