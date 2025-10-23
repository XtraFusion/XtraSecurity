import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  req: Request,
  { params }: { params: { branchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: params.branchId },
      include: { project: true }
    });

    if (!branch) {
      return new NextResponse("Branch not found", { status: 404 });
    }

    // Only project owner can clear branch secrets
    if (branch.project.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete all secrets in the branch
    await prisma.secret.deleteMany({
      where: {
        branchId: params.branchId
      }
    });

    return NextResponse.json({ message: "Branch cleared successfully" });
  } catch (error) {
    console.error("[BRANCH_CLEAR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}