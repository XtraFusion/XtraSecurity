import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { verifyAuth } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";

const accessLevelSchema = z.object({
  accessLevel: z.enum(['private', 'team', 'public'])
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
    const { accessLevel } = accessLevelSchema.parse(body);

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: { accessControl: accessLevel }
    });

    try {
      await logAudit(
        "PROJECT_ACCESS_LEVEL_UPDATED",
        auth.userId,
        params.id,
        { previousAccessLevel: project.accessControl, newAccessLevel: accessLevel },
        project.workspaceId || undefined
      );
    } catch (auditErr) {
      console.error("Failed to write audit log:", auditErr);
    }

    return NextResponse.json(updatedProject);
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