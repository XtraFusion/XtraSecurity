import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { triggerWebhooks } from "@/lib/webhook";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; env: string; key: string } }
) {
  // 1. Authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = auth.userId;

  // 2. Access Control
  const project = await prisma.project.findFirst({
    where: {
      id: params.projectId,
      OR: [
        { userId: userId },
      ]
    }
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
  }

  // 3. Fetch Secret
  const secret = await prisma.secret.findFirst({
    where: {
      projectId: params.projectId,
      environmentType: params.env,
      key: params.key
    }
  });

  if (!secret) {
    return NextResponse.json({ error: "Secret not found" }, { status: 404 });
  }

  return NextResponse.json(secret);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; env: string; key: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = auth.userId;
    const { projectId, env, key } = await params;

    // Verify Project Access
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: auth.userId }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const secret = await prisma.secret.findFirst({
        where: { projectId, environmentType: env, key }
    });

    if (!secret) return NextResponse.json({ error: "Secret not found" }, { status: 404 });

    await prisma.secret.delete({ where: { id: secret.id } });

    // Trigger Webhook
    triggerWebhooks(projectId, "secret.delete", {
        key,
        environment: env,
        updatedBy: userId
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
