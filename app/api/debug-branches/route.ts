import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const branches = await prisma.branch.findMany({
    where: { projectId: projectId || "" },
    include: { secrets: true }
  });
  return NextResponse.json(branches);
}
