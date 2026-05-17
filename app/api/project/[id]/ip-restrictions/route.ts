import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { verifyAuth } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";

const ipRestrictionSchema = z.object({
  ip: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/),
  description: z.string().min(1).max(255)
});

export async function POST(
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
    const ipRestriction = ipRestrictionSchema.parse(body);

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        ipRestrictions: {
          push: ipRestriction
        }
      }
    });

    try {
      await logAudit(
        "PROJECT_IP_ADDED",
        auth.userId,
        params.id,
        { ip: ipRestriction.ip, description: ipRestriction.description },
        project.workspaceId || undefined
      );
    } catch (auditErr) {
      console.error("Failed to write audit log:", auditErr);
    }

    return NextResponse.json(updatedProject);
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
  { params }: { params: { id: string; ip?: string } }
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

    const url = new URL(request.url);
    const ip = url.searchParams.get("ip") || params.ip;

    if (!ip) {
      return NextResponse.json({ error: 'IP parameter is required' }, { status: 400 });
    }

    const updatedRestrictions = project.ipRestrictions?.filter(
      (r: any) => r.ip !== ip
    ) || [];

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        ipRestrictions: updatedRestrictions
      }
    });

    try {
      await logAudit(
        "PROJECT_IP_REMOVED",
        auth.userId,
        params.id,
        { ip },
        project.workspaceId || undefined
      );
    } catch (auditErr) {
      console.error("Failed to write audit log:", auditErr);
    }

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove IP restriction' },
      { status: 500 }
    );
  }
}