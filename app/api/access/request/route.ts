import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// POST /api/access/request
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { secretId, projectId, reason, duration, workspaceId } = await req.json();

    if (!reason || !duration) {
        return NextResponse.json({ error: "Reason and duration are required" }, { status: 400 });
    }

    // Validation: Must have at least secretId OR projectId
    if (!secretId && !projectId) {
        return NextResponse.json({ error: "Must specify secretId or projectId" }, { status: 400 });
    }

    // Resolve Workspace ID if not provided
    let effectiveWorkspaceId = workspaceId;

    if (!effectiveWorkspaceId) {
        if (projectId) {
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (project) effectiveWorkspaceId = project.workspaceId;
        } else if (secretId) {
            const secret = await prisma.secret.findUnique({ 
                where: { id: secretId },
                include: { project: true }
            });
            if (secret && secret.project) effectiveWorkspaceId = secret.project.workspaceId;
        }
    }

    const request = await prisma.accessRequest.create({
        data: {
            userId: auth.userId,
            secretId: secretId,
            projectId: projectId,
            workspaceId: effectiveWorkspaceId || null,
            reason: reason,
            duration: parseInt(duration),
            status: "pending"
        }
    });

    return NextResponse.json({
        success: true,
        message: "Access request created",
        requestId: request.id,
        status: request.status
    });

  } catch (error: any) {
    console.error("Access request error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
