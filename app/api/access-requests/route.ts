import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";

// POST /api/access-requests -> Create a new request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { secretId, projectId, reason, duration } = await req.json();

    if (!reason || !duration) {
      return NextResponse.json({ error: "Reason and duration are required" }, { status: 400 });
    }

    if (!secretId && !projectId) {
      return NextResponse.json({ error: "Must specify secretId or projectId" }, { status: 400 });
    }

    // Determine target project ID for scoping (if secretId provided, lookup project)
    let targetProjectId = projectId;
    if (secretId) {
      const secret = await prisma.secret.findUnique({ where: { id: secretId } });
      if (!secret) {
        return NextResponse.json({ error: "Secret not found" }, { status: 404 });
      }
      targetProjectId = secret.projectId;
    }

    if (!targetProjectId) {
         return NextResponse.json({ error: "Project Context missing" }, { status: 400 });
    }

    // Verify user has access to this workspace
    const project = await prisma.project.findUnique({ 
        where: { id: targetProjectId },
        select: { workspaceId: true }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const roleInWorkspace = await getUserWorkspaceRole(session.user.id, project.workspaceId);

    if (!roleInWorkspace) {
        return NextResponse.json({ error: "You do not have access to this workspace" }, { status: 403 });
    }

    const request = await prisma.accessRequest.create({
      data: {
        userId: session.user.id,
        secretIds: secretId ? [secretId] : [],
        projectId: targetProjectId,
        reason,
        duration: Number(duration),
        status: "pending",
        workspaceId: project.workspaceId,
        requestedAt: new Date(),
      },
    });

    return NextResponse.json(request);
  } catch (error) {
    console.error("Failed to create access request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/access-requests -> List requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    if (!workspaceId && !projectId) {
        return NextResponse.json({ error: "Workspace ID or Project ID is required" }, { status: 400 });
    }

    // Permission Check
    const { getUserWorkspaceRole, getUserProjectRole } = await import("@/lib/permissions");
    
    let role;
    let targetWorkspaceId = workspaceId;

    if (projectId) {
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { workspaceId: true } });
        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
        targetWorkspaceId = project.workspaceId;
        role = await getUserProjectRole(session.user.id, projectId);
        if (!role) role = await getUserWorkspaceRole(session.user.id, targetWorkspaceId);
    } else if (workspaceId) {
        role = await getUserWorkspaceRole(session.user.id, workspaceId);
    }

    const isGlobalAdmin = session.user.role === "admin";

    if (!role && !isGlobalAdmin) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const whereClause: any = {};
    if (targetWorkspaceId) whereClause.workspaceId = targetWorkspaceId;
    if (projectId) whereClause.projectId = projectId;
    
    if (status) whereClause.status = status;

    // Admins/Owners see all requests for the workspace/project
    // Members/Viewers see only their own requests
    if (!isGlobalAdmin && role !== "admin" && role !== "owner") {
      whereClause.userId = session.user.id;
    }

    const requests = await prisma.accessRequest.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { requestedAt: "desc" },
    });

    // Manually fetch secrets for these requests
    const secretIds = Array.from(new Set(requests.flatMap(r => r.secretIds || [])));
    const secrets = await prisma.secret.findMany({
        where: { id: { in: secretIds } },
        select: { id: true, key: true }
    });
    const secretMap = new Map(secrets.map(s => [s.id, s]));

    const enrichedRequests = requests.map(r => ({
        ...r,
        secret: (r.secretIds && r.secretIds.length > 0) ? secretMap.get(r.secretIds[0]) : null
    }));

    return NextResponse.json(enrichedRequests);
  } catch (error) {
    console.error("Failed to list access requests:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
