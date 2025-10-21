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

    // Only project owner can clear project data
    if (project.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Clear all project data
    await prisma.$transaction([
      prisma.secret.deleteMany({
        where: { projectId: params.id }
      }),
      prisma.branch.deleteMany({
        where: { projectId: params.id }
      }),
    ]);

    return NextResponse.json({ message: "Project cleared successfully" });
  } catch (error) {
    console.error("[PROJECT_CLEAR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}