import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getUserWorkspaceRole } from "@/lib/permissions";
import { verifyAuth } from "@/lib/server-auth";

// GET /api/access-reviews?workspaceId=xxx - List users in the workspace for review
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // Only workspace owners/admins can perform access reviews
    const role = await getUserWorkspaceRole(auth.userId, workspaceId);
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only workspace owners and admins can conduct access reviews." }, { status: 403 });
    }

    // 1. Find the start of the current review cycle for this workspace
    const lastCycle = await prisma.auditLog.findFirst({
      where: { action: "access_review_start", workspaceId },
      orderBy: { timestamp: "desc" }
    });
    const cycleStartTime = lastCycle?.timestamp || new Date(0);

    // 2. Find all users who have team membership in this workspace
    const teamsInWorkspace = await prisma.team.findMany({
      where: { workspaceId },
      select: { id: true }
    });
    const teamIds = teamsInWorkspace.map(t => t.id);

    const teamMemberships = await prisma.teamUser.findMany({
      where: { teamId: { in: teamIds }, status: "active" },
      select: { userId: true }
    });

    // 3. Find all users who own projects in this workspace
    const projectsInWorkspace = await prisma.project.findMany({
      where: { workspaceId },
      select: { userId: true }
    });

    // 4. Combine unique user IDs — exclude the reviewer themselves
    const allUserIds = [
      ...new Set([
        ...teamMemberships.map(m => m.userId),
        ...projectsInWorkspace.map(p => p.userId)
      ])
    ].filter(id => id !== auth.userId);

    if (allUserIds.length === 0) {
      return NextResponse.json([]);
    }

    // 5. Fetch full user details scoped to workspace members only
    const users = await prisma.user.findMany({
      where: { id: { in: allUserIds } },
      include: {
        userRoles: {
          include: { project: true, role: true }
        },
        reviewsReceived: {
          where: { reviewedAt: { gte: cycleStartTime } },
          orderBy: { reviewedAt: "desc" },
          take: 1
        }
      }
    });

    // 6. Fetch most recent AuditLog entry per user for real last-activity timestamp
    const recentActivity = await prisma.auditLog.findMany({
      where: { userId: { in: allUserIds } },
      orderBy: { timestamp: "desc" },
      distinct: ["userId"],
      select: { userId: true, timestamp: true }
    });
    const activityMap = new Map(recentActivity.map(a => [a.userId, a.timestamp]));

    // 7. Map to response
    const reviews = users.map(u => {
      const latestReview = u.reviewsReceived[0];
      const status = latestReview ? latestReview.status : "pending_review";

      // Only show roles scoped to this workspace's projects
      const scopedRoles = u.userRoles
        .filter(r => r.project?.workspaceId === workspaceId)
        .map(r => ({
          role: r.role?.name || "Unknown",
          project: r.project?.name || "Global"
        }));

      // Use the most recent AuditLog timestamp; fall back to user updatedAt if none exists
      const lastActive = activityMap.get(u.id) ?? u.updatedAt;

      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        roles: scopedRoles,
        lastLogin: lastActive,
        status
      };
    });

    return NextResponse.json(reviews);

  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/access-reviews - Start a new review cycle for a workspace
export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await req.json();
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });

    const role = await getUserWorkspaceRole(auth.userId, workspaceId);
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: "access_review_start",
        entity: "workspace",
        entityId: workspaceId,
        workspaceId,
        changes: { description: "Access Review cycle initiated" }
      }
    });

    return NextResponse.json({ success: true, message: "Access review cycle started" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/access-reviews - Approve or revoke a user's access within a workspace
export async function PUT(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userId, decision, workspaceId } = body;

    if (!userId || !workspaceId || !["approve", "revoke"].includes(decision)) {
      return NextResponse.json({ error: "Invalid request: userId, workspaceId, and decision are required." }, { status: 400 });
    }

    const role = await getUserWorkspaceRole(auth.userId, workspaceId);
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create the review record
    const review = await prisma.accessReview.create({
      data: {
        userId,
        reviewerId: auth.userId,
        status: decision === "approve" ? "approved" : "revoked",
        notes: `${decision === "approve" ? "Access approved" : "Access revoked"} by ${auth.name} in workspace ${workspaceId}`
      }
    });

    if (decision === "revoke") {
      // 1. Find all team IDs in this workspace
      const teamsInWorkspace = await prisma.team.findMany({
        where: { workspaceId },
        select: { id: true }
      });
      const teamIds = teamsInWorkspace.map(t => t.id);

      // 2. Remove user from all teams in this workspace only
      await prisma.teamUser.deleteMany({
        where: {
          userId,
          teamId: { in: teamIds }
        }
      });

      // 3. Find all project IDs in this workspace
      const projectsInWorkspace = await prisma.project.findMany({
        where: { workspaceId },
        select: { id: true }
      });
      const projectIds = projectsInWorkspace.map(p => p.id);

      // 4. Remove user roles scoped to this workspace's projects only
      await prisma.userRole.deleteMany({
        where: {
          userId,
          projectId: { in: projectIds }
        }
      });

      // 5. Audit log
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: "access_revoked",
          entity: "user",
          entityId: userId,
          workspaceId,
          changes: {
            description: `User access revoked from workspace ${workspaceId} during access review.`,
            teamsAffected: teamIds.length,
            projectsAffected: projectIds.length
          }
        }
      });
    } else {
      // Audit approval
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          action: "access_approved",
          entity: "user",
          entityId: userId,
          workspaceId,
          changes: { description: `User access approved in workspace ${workspaceId} during access review.` }
        }
      });
    }

    return NextResponse.json({ success: true, review });

  } catch (error: any) {
    console.error("Error submitting review:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
