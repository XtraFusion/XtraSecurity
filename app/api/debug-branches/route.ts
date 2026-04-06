import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const branches = await prisma.branch.findMany({
    where: { projectId },
    include: { secrets: true }
  });
  return NextResponse.json(branches);
}
