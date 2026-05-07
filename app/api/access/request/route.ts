import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withSecurity } from "@/lib/api-middleware";

// POST /api/access/request
export const POST = withSecurity(async (req: NextRequest, _context: any, auth: any) => {
    const { secretId, secretIds, projectId, reason, duration, workspaceId } = await req.json();

    if (!reason || !duration) {
        return NextResponse.json({ error: "Reason and duration are required" }, { status: 400 });
    }

    // Validation: Must have at least secretIds OR projectId
    const effectiveSecretIds = secretIds || (secretId ? [secretId] : []);
    if (effectiveSecretIds.length === 0 && !projectId) {
        return NextResponse.json({ error: "Must specify secretIds or projectId" }, { status: 400 });
    }

    // Resolve Workspace ID if not provided
    let effectiveWorkspaceId = workspaceId;

    if (!effectiveWorkspaceId) {
        if (projectId) {
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (project) effectiveWorkspaceId = project.workspaceId;
        } else if (effectiveSecretIds.length > 0) {
            const secret = await prisma.secret.findUnique({ 
                where: { id: effectiveSecretIds[0] },
                include: { project: true }
            });
            if (secret && secret.project) effectiveWorkspaceId = secret.project.workspaceId;
        }
    }

    const request = await prisma.accessRequest.create({
        data: {
            userId: auth.userId,
            secretIds: effectiveSecretIds,
            projectId: projectId,
            workspaceId: effectiveWorkspaceId || null,
            reason: reason,
            duration: parseInt(duration),
            status: "pending"
        },
        include: { user: { select: { name: true, email: true } } }
    });

    // Create Notifications for Admins/Owners
    if (effectiveWorkspaceId) {
        try {
            // 1. Get workspace owner
            const workspace = await prisma.workspace.findUnique({
                where: { id: effectiveWorkspaceId },
                select: { createdBy: true, name: true, user: { select: { email: true } } }
            });

            // 2. Get workspace admins (from teams)
            const teamAdmins = await prisma.teamUser.findMany({
                where: {
                    role: "admin",
                    status: "active",
                    team: { workspaceId: effectiveWorkspaceId }
                },
                select: { userId: true, user: { select: { email: true } } }
            });

            const adminIds = new Set<string>();
            if (workspace) adminIds.add(workspace.createdBy);
            teamAdmins.forEach(ta => adminIds.add(ta.userId));

            // Don't notify the requester if they are an admin
            adminIds.delete(auth.userId);

            const notifications = [];
            for (const adminId of Array.from(adminIds)) {
                // Find email (workspace owner or team admin)
                let email = "";
                if (adminId === workspace?.createdBy) email = workspace.user.email || "";
                else email = teamAdmins.find(ta => ta.userId === adminId)?.user.email || "";

                if (email) {
                    notifications.push({
                        userId: adminId,
                        userEmail: email,
                        taskTitle: "New Access Request",
                        description: `${request.user.name || request.user.email} is requesting JIT access to a secret in ${workspace?.name || 'Workspace'}.`,
                        message: `Reason: ${reason}`,
                        status: "pending",
                        workspaceId: effectiveWorkspaceId,
                        read: false
                    });
                }
            }

            if (notifications.length > 0) {
                await prisma.notification.createMany({ data: notifications });
            }
        } catch (notifErr) {
            console.error("Failed to create notifications for access request:", notifErr);
        }
    }

    return NextResponse.json({
        success: true,
        message: "Access request created",
        requestId: request.id,
        status: request.status
    });
});

// GET /api/access/request?id=...
export const GET = withSecurity(async (req: NextRequest, _context: any, _auth: any) => {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const request = await prisma.accessRequest.findUnique({
        where: { id },
        select: {
            id: true,
            status: true,
            expiresAt: true,
            projectId: true,
            secretIds: true
        }
    });

    if (!request) {
        return NextResponse.json({ error: "Access request not found" }, { status: 404 });
    }

    return NextResponse.json(request);
});
