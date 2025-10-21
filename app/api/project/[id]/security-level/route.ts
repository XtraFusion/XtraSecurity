import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

// Validation schema for security level
const securityLevelSchema = z.object({
  securityLevel: z.enum(['low', 'medium', 'high'])
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { securityLevel } = securityLevelSchema.parse(body);

    const project = await prisma.project.update({
      where: { id: params.id },
      data: { securityLevel }
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid security level' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update security level' },
      { status: 500 }
    );
  }
}