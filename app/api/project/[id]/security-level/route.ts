import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { verifyAuth } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";

const securityLevelSchema = z.object({
  securityLevel: z.enum(['low', 'medium', 'high'])
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: auth.userId
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { securityLevel } = securityLevelSchema.parse(body);

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: { securityLevel }
    });

    try {
      await logAudit(
        "PROJECT_SECURITY_LEVEL_UPDATED",
        auth.userId,
        params.id,
        { previousSecurityLevel: project.securityLevel, newSecurityLevel: securityLevel },
        project.workspaceId || undefined
      );
    } catch (auditErr) {
      console.error("Failed to write audit log:", auditErr);
    }

    return NextResponse.json(updatedProject);
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