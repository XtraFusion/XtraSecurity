import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/db';
import { verifyAuth } from "@/lib/server-auth";

export async function POST(
  req: Request,
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

    // Only project owner can clear branch secrets
    if (branch.project.userId !== auth.userId) {
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