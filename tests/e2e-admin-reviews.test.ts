import { GET as getAccessReviews, POST as startReviewCycle, PUT as submitAccessReview } from "@/app/api/access-reviews/route";
import { createMockRequest, createTestUser, createTestWorkspace, createTestProject, cleanupUserResources, createTestTeam } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";

describe("E2E: Admin Access Reviews Page & Periodic Certification Lifecycle", () => {
  const tracker = {
    userIds: [] as string[],
  };

  let owner: any;
  let devUser: any;
  let unauthorizedViewer: any;
  let workspace: any;
  let project: any;
  let team: any;

  beforeAll(async () => {
    // 1. Create Users
    owner = await createTestUser({ email: "review.owner@xtrasecurity.test", role: "admin" });
    devUser = await createTestUser({ email: "review.dev@xtrasecurity.test", role: "user" });
    unauthorizedViewer = await createTestUser({ email: "review.viewer@xtrasecurity.test", role: "user" });

    tracker.userIds.push(owner.user.id, devUser.user.id, unauthorizedViewer.user.id);

    // 2. Setup Workspace & Project
    workspace = await createTestWorkspace(owner.user, "Compliance Review Workspace");
    project = await createTestProject(owner.user, workspace.id, { name: "Banking Secrets Core" });

    // 3. Create Team and assign devUser as active member
    team = await createTestTeam(owner.user, workspace.id, { name: "Backend SecOps" });
    await prisma.teamUser.create({
      data: {
        teamId: team.id,
        userId: devUser.user.id,
        role: "developer",
        status: "active",
      },
    });

    await prisma.teamProject.create({
      data: {
        teamId: team.id,
        projectId: project.id,
      },
    });

    // 4. Invalidate permissions cache
    for (const uid of tracker.userIds) {
      await invalidateUserRbacCache(uid);
    }
  });

  afterAll(async () => {
    await cleanupUserResources(tracker.userIds);
  });

  it("1. SECURITY: Non-admin/non-owner is blocked from viewing access reviews (403 Forbidden)", async () => {
    const req = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/access-reviews?workspaceId=${workspace.id}`,
      token: unauthorizedViewer.token,
    });

    const res = await getAccessReviews(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Forbidden");
  });

  it("2. GET /api/access-reviews -> Owner lists workspace members with pending_review status", async () => {
    const req = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/access-reviews?workspaceId=${workspace.id}`,
      token: owner.token,
    });

    const res = await getAccessReviews(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(Array.isArray(data)).toBe(true);
    const member = data.find((m: any) => m.userId === devUser.user.id);
    expect(member).toBeDefined();
    expect(member.email).toBe(devUser.user.email);
    expect(member.status).toBe("pending_review");
    expect(member.lastLogin).toBeDefined();
  });

  it("3. POST /api/access-reviews -> Owner starts a new review cycle", async () => {
    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/access-reviews",
      token: owner.token,
      body: { workspaceId: workspace.id },
    });

    const res = await startReviewCycle(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("Access review cycle started");

    // Verify audit log for cycle initiation
    const audit = await prisma.auditLog.findFirst({
      where: { action: "access_review_start", workspaceId: workspace.id },
      orderBy: { timestamp: "desc" },
    });
    expect(audit).toBeDefined();
    expect(audit?.userId).toBe(owner.user.id);
  });

  it("4. PUT /api/access-reviews -> Owner certifies/approves user access (status -> approved)", async () => {
    const req = createMockRequest({
      method: "PUT",
      url: "http://localhost:3000/api/access-reviews",
      token: owner.token,
      body: {
        userId: devUser.user.id,
        decision: "approve",
        workspaceId: workspace.id,
      },
    });

    const res = await submitAccessReview(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.review.status).toBe("approved");

    // Verify GET now reflects "approved"
    const getReq = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/access-reviews?workspaceId=${workspace.id}`,
      token: owner.token,
    });
    const getRes = await getAccessReviews(getReq);
    const members = await getRes.json();
    const reviewedMember = members.find((m: any) => m.userId === devUser.user.id);
    expect(reviewedMember?.status).toBe("approved");
  });

  it("5. PUT /api/access-reviews -> Owner revokes user access (removes user from teams & logs audit)", async () => {
    const req = createMockRequest({
      method: "PUT",
      url: "http://localhost:3000/api/access-reviews",
      token: owner.token,
      body: {
        userId: devUser.user.id,
        decision: "revoke",
        workspaceId: workspace.id,
      },
    });

    const res = await submitAccessReview(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.review.status).toBe("revoked");

    // Verify user was removed from the team in this workspace
    const teamMembership = await prisma.teamUser.findFirst({
      where: { teamId: team.id, userId: devUser.user.id },
    });
    expect(teamMembership).toBeNull();

    // Verify audit log for revocation
    const revokeAudit = await prisma.auditLog.findFirst({
      where: { action: "access_revoked", entityId: devUser.user.id, workspaceId: workspace.id },
      orderBy: { timestamp: "desc" },
    });
    expect(revokeAudit).toBeDefined();
  });

  it("6. SECURITY: Non-admin cannot approve or revoke access (403 Forbidden)", async () => {
    const req = createMockRequest({
      method: "PUT",
      url: "http://localhost:3000/api/access-reviews",
      token: unauthorizedViewer.token,
      body: {
        userId: devUser.user.id,
        decision: "approve",
        workspaceId: workspace.id,
      },
    });

    const res = await submitAccessReview(req);
    expect(res.status).toBe(403);
  });
});
