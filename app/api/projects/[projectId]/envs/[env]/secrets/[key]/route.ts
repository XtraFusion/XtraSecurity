import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { triggerWebhooks } from "@/lib/webhook";
import { PolicyEngine } from "@/lib/authz/policy-engine";
import { Decision } from "@/lib/authz/types";

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
    },
    select: { id: true, workspaceId: true }
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

  // 4. Authorization via Policy Engine
  const decision = await PolicyEngine.authorize({
    userId,
    projectId: params.projectId,
    resource: "secret",
    action: "value.read",
    environment: params.env,
    context: { secretId: secret.id } 
  });

  if (decision === Decision.DENY) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  
  if (decision === Decision.REQUIRES_ELEVATION) {
     return NextResponse.json({ 
         error: "JIT Elevation Required", 
         action: "request_jit"
     }, { status: 403 });
  }

  // 5. Audit Logging (Async)
  const workspaceId = project.workspaceId; // captured above
  // We don't await this to avoid slowing down the response
  prisma.auditLog.create({
    data: {
      userId,
      action: "secret.read",
      entity: "secret",
      entityId: secret.id,
      workspaceId,
      changes: { key: params.key, env: params.env }
    }
  }).catch(err => console.error("Failed to log secret access:", err));

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

    // Verify Project Exists (Relaxed check, rely on PolicyEngine)
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, workspaceId: true }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const secret = await prisma.secret.findFirst({
        where: { projectId, environmentType: env, key }
    });

    if (!secret) return NextResponse.json({ error: "Secret not found" }, { status: 404 });

    // Authorization via Policy Engine
    const decision = await PolicyEngine.authorize({
        userId,
        projectId: projectId,
        resource: "secret",
        action: "secret.delete",
        environment: env,
        context: { secretId: secret.id } 
    });

    if (decision === Decision.DENY) {
        return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await prisma.secret.delete({ where: { id: secret.id } });

    // Trigger Webhook
    triggerWebhooks(projectId, "secret.delete", {
        key,
        environment: env,
        updatedBy: userId
    });

    // Audit Log
    await prisma.auditLog.create({
        data: {
            userId,
            action: "secret.delete",
            entity: "secret",
            entityId: secret.id,
            workspaceId: project.workspaceId,
            changes: { key, env }
        }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
