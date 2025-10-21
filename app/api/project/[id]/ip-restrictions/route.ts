import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

// Validation schema for IP restrictions
const ipRestrictionSchema = z.object({
  ip: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/),
  description: z.string().min(1).max(255)
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const ipRestriction = ipRestrictionSchema.parse(body);

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ipRestrictions: {
          push: ipRestriction
        }
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid IP restriction format' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to add IP restriction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; ip: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updatedRestrictions = project.ipRestrictions?.filter(
      (r: any) => r.ip !== params.ip
    ) || [];

    await prisma.project.update({
      where: { id: params.id },
      data: {
        ipRestrictions: updatedRestrictions
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove IP restriction' },
      { status: 500 }
    );
  }
}