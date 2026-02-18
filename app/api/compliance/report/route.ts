import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspaceId");

    const generatedAt = new Date().toISOString();

    // ── 1. Workspaces the user owns ──────────────────────────────────────────
    const workspaces = await prisma.workspace.findMany({
      where: { createdBy: session.user.id },
      select: { id: true, name: true, subscriptionPlan: true, createdAt: true },
    });

    // ── 2. Projects in scope ─────────────────────────────────────────────────
    const projectWhere: any = { userId: session.user.id };
    if (workspaceId) projectWhere.workspaceId = workspaceId;

    const projects = await prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        name: true,
        workspaceId: true,
        accessControl: true,
        securityLevel: true,
        twoFactorRequired: true,
        auditLogging: true,
        lastSecurityAudit: true,
        createdAt: true,
      },
    });

    const projectIds = projects.map((p) => p.id);

    // ── 3. Access Control — who has roles on these projects ──────────────────
    const userRoles = await prisma.userRole.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        user: { select: { email: true, name: true } },
        role: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    const accessControl = userRoles.map((ur) => ({
      user: ur.user?.name || ur.user?.email || "Unknown",
      email: ur.user?.email || "",
      role: ur.role?.name || "Unknown",
      project: ur.project?.name || "Unknown",
      projectId: ur.projectId,
      grantedAt: ur.grantedAt,
      expiresAt: ur.expiresAt,
    }));

    // ── 4. Secret Rotation Status ────────────────────────────────────────────
    const secrets = await prisma.secret.findMany({
      where: { projectId: { in: projectIds } },
      select: {
        id: true,
        key: true,
        environmentType: true,
        rotationPolicy: true,
        lastUpdated: true,
        expiryDate: true,
        project: { select: { name: true } },
        rotationSchedule: {
          select: {
            frequency: true,
            nextRotation: true,
            lastRotation: true,
            status: true,
          },
        },
      },
    });

    const now = new Date();
    const rotationStatus = secrets.map((s) => ({
      key: s.key,
      project: s.project?.name || "Unknown",
      environment: s.environmentType,
      policy: s.rotationPolicy,
      lastRotated: s.rotationSchedule?.lastRotation ?? s.lastUpdated,
      nextRotation: s.rotationSchedule?.nextRotation ?? null,
      scheduleStatus: s.rotationSchedule?.status ?? "none",
      isOverdue:
        s.rotationSchedule?.nextRotation
          ? new Date(s.rotationSchedule.nextRotation) < now
          : false,
      expiryDate: s.expiryDate,
    }));

    // ── 5. Admin Actions (recent audit log) ──────────────────────────────────
    const adminActions = await prisma.auditLog.findMany({
      where: {
        userId: session.user.id,
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: { timestamp: "desc" },
      take: 50,
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    const auditEntries = adminActions.map((log) => ({
      timestamp: log.timestamp,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      user: log.user?.name || log.user?.email || "Unknown",
    }));

    // ── 6. Summary counts ────────────────────────────────────────────────────
    const overdueCount = rotationStatus.filter((s) => s.isOverdue).length;
    const prodAccessCount = accessControl.filter((a) =>
      a.project?.toLowerCase().includes("prod")
    ).length;

    return NextResponse.json({
      generatedAt,
      generatedBy: session.user.email || session.user.id,
      workspaces,
      summary: {
        totalProjects: projects.length,
        totalSecrets: secrets.length,
        overdueRotations: overdueCount,
        prodAccessEntries: prodAccessCount,
        totalAuditEntries: auditEntries.length,
      },
      projects,
      accessControl,
      rotationStatus,
      auditEntries,
    });
  } catch (error: any) {
    console.error("[compliance/report]", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate compliance report" },
      { status: 500 }
    );
  }
}
