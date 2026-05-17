import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { verifyAuth } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";

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
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: auth.userId
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const settings = securitySettingsSchema.parse(body);

    const updatedProject = await prisma.project.update({
      where: { id: id },
      data: settings
    });

    try {
      await logAudit(
        "PROJECT_SECURITY_SETTINGS_UPDATED",
        auth.userId,
        id,
        { settings },
        project.workspaceId || undefined
      );
    } catch (auditErr) {
      console.error("Failed to write audit log:", auditErr);
    }

    return NextResponse.json(updatedProject);
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