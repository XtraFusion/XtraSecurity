import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Only project owner can toggle block status
    if (project.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Toggle block status
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        status: project.status === 'blocked' ? 'active' : 'blocked'
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("[PROJECT_TOGGLE_BLOCK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}