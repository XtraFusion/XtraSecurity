import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth } from '@/lib/server-auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: params.branchId },
      include: { project: true }
    });

    if (!branch) {
      return new NextResponse("Branch not found", { status: 404 });
    }

    // Check if user has permission to delete branch
    if (branch.project.userId !== auth.userId) {
      // Check if user is a team admin
      const teamMember = await prisma.teamUser.findFirst({
        where: {
          userId: auth.userId,
          team: {
            teamProjects: {
              some: {
                projectId: branch.projectId
              }
            }
          },
          role: "admin"
        }
      });

      if (!teamMember) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    // Delete the branch and its secrets
    await prisma.$transaction([
      prisma.secret.deleteMany({
        where: { branchId: params.branchId }
      }),
      prisma.branch.delete({
        where: { id: params.branchId }
      })
    ]);

    return NextResponse.json({ message: "Branch deleted successfully" });
  } catch (error) {
    console.error("[BRANCH_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}