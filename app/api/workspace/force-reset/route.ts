import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-middleware";
import prisma from "@/lib/db";
import { getUserWorkspaceRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// POST /api/workspace/force-reset
// Permanently wipes all projects, branches, secrets, and metadata in a workspace,
// then updates the workspace with a newly generated Zero-Knowledge master key sentinel.
export const POST = withSecurity(async (request: NextRequest, context: any, session: any) => {
  try {
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const body = await request.json();
    const { workspaceId, confirmation, newVaultSentinel } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    if (confirmation !== "CONFIRM_FORCE_RESET") {
      return NextResponse.json(
        { error: "Confirmation code 'CONFIRM_FORCE_RESET' is required to perform this destructive action." },
        { status: 400 }
      );
    }

    // Role check: Only Workspace Owner or Admin can trigger emergency force key reset
    const role = await getUserWorkspaceRole(userId, workspaceId);
    if (!role || (role !== "owner" && role !== "admin")) {
      return NextResponse.json(
        { error: "Forbidden: Only workspace owners and admins can perform a force key reset." },
        { status: 403 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { projects: { select: { id: true, name: true } } },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const projectIds = workspace.projects.map((p) => p.id);

    // 1. Delete all secrets, branches, and project-related metadata
    if (projectIds.length > 0) {
      await prisma.secretShare?.deleteMany({ where: { secret: { projectId: { in: projectIds } } } }).catch(() => {});
      await prisma.secretSync?.deleteMany({ where: { secret: { projectId: { in: projectIds } } } }).catch(() => {});
      await prisma.rotationSchedule?.deleteMany({ where: { secret: { projectId: { in: projectIds } } } }).catch(() => {});
      await prisma.secret.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.branch.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.teamProject.deleteMany({ where: { projectId: { in: projectIds } } }).catch(() => {});
      await prisma.serviceAccount.deleteMany({ where: { projectId: { in: projectIds } } }).catch(() => {});
      await prisma.accessRequest.deleteMany({ where: { projectId: { in: projectIds } } }).catch(() => {});
      await prisma.webhook.deleteMany({ where: { projectId: { in: projectIds } } }).catch(() => {});
      await prisma.userRole.deleteMany({ where: { projectId: { in: projectIds } } }).catch(() => {});
      await prisma.oidcTrustPolicy?.deleteMany({ where: { projectId: { in: projectIds } } }).catch(() => {});
      await prisma.breakGlassSession?.deleteMany({ where: { projectId: { in: projectIds } } }).catch(() => {});
      await prisma.project.deleteMany({ where: { workspaceId } });
    }

    // 2. Update workspace sentinel with the new key sentinel (or reset to null)
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        vaultSentinel: newVaultSentinel !== undefined ? newVaultSentinel : null,
        updatedAt: new Date(),
      },
    });

    // 3. Log emergency audit log
    await logAudit(
      "WORKSPACE_FORCE_KEY_RESET",
      userId,
      workspaceId,
      {
        wipedProjectsCount: projectIds.length,
        wipedProjectIds: projectIds,
        newSentinelConfigured: Boolean(newVaultSentinel),
        reason: "Emergency Zero-Knowledge Force Key Reset & Data Wipe",
      },
      workspaceId
    ).catch((e) => console.error("Failed to log audit for force reset:", e));

    return NextResponse.json({
      success: true,
      message: `Workspace reset successfully. Purged ${projectIds.length} projects and all associated encrypted secrets. New Zero-Knowledge master key established.`,
      workspace: updatedWorkspace,
      purgedProjectIds: projectIds,
    });
  } catch (error: any) {
    console.error("Error performing workspace force reset:", error);
    return NextResponse.json(
      { error: "Failed to force reset workspace", details: error.message },
      { status: 500 }
    );
  }
});
