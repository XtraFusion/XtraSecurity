import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

// Validation schema for access level
const accessLevelSchema = z.object({
  accessLevel: z.enum(['private', 'team', 'public'])
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { accessLevel } = accessLevelSchema.parse(body);

    const project = await prisma.project.update({
      where: { id: params.id },
      data: { accessControl: accessLevel }
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid access level' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update access level' },
      { status: 500 }
    );
  }
}