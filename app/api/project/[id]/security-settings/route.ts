import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

// Validation schema for security settings
const securitySettingsSchema = z.object({
  twoFactorRequired: z.boolean().optional(),
  passwordMinLength: z.number().min(8).max(128).optional(),
  passwordRequireSpecialChars: z.boolean().optional(),
  passwordRequireNumbers: z.boolean().optional(),
  passwordExpiryDays: z.number().min(0).max(365).optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const settings = securitySettingsSchema.parse(body);

    const project = await prisma.project.update({
      where: { id: id },
      data: settings
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid security settings' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update security settings' },
      { status: 500 }
    );
  }
}