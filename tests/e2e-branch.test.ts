import { GET as getBranches, POST as handleBranchPost, DELETE as deleteBranch } from "@/app/api/branch/route";
import { createMockRequest, createTestUser, createTestProject, createTestBranch, cleanupTestData } from "./helpers/test-utils";
import prisma from "@/lib/db";

describe("E2E: Branch Lifecycle & Multi-Tenant Security", () => {
  const tracker: {
    userIds: string[];
    projectIds: string[];
    branchIds: string[];
  } = {
    userIds: [],
    projectIds: [],
    branchIds: [],
  };

  afterAll(async () => {
    await cleanupTestData(tracker);
  });

  it("should create a new branch under an authorized project", async () => {
    const { user, token } = await createTestUser({ role: "owner" });
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Branch Test Project" });
    tracker.projectIds.push(project.id);

    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/branch",
      token,
      body: {
        name: "feature/payment-v2",
        description: "Payment gateway upgrade branch",
        projectId: project.id,
        versionNo: "1",
      },
    });

    const res = await handleBranchPost(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.name).toBe("feature/payment-v2");
    expect(data.projectId).toBe(project.id);
    expect(data.id).toBeDefined();

    tracker.branchIds.push(data.id);
  });

  it("should list branches when valid projectId is supplied", async () => {
    const { user, token } = await createTestUser();
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Multi Branch Project" });
    tracker.projectIds.push(project.id);

    const b1 = await createTestBranch(user, project.id, { name: "main" });
    const b2 = await createTestBranch(user, project.id, { name: "staging" });
    tracker.branchIds.push(b1.id, b2.id);

    const req = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/branch?projectId=${project.id}`,
      token,
      searchParams: { projectId: project.id },
    });

    const res = await getBranches(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    const branchNames = data.map((b: any) => b.name);
    expect(branchNames).toContain("main");
    expect(branchNames).toContain("staging");
  });

  it("SECURITY: should reject GET /api/branch when projectId parameter is missing", async () => {
    const { user, token } = await createTestUser();
    tracker.userIds.push(user.id);

    const req = createMockRequest({
      method: "GET",
      url: "http://localhost:3000/api/branch",
      token,
    });

    const res = await getBranches(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("projectId query parameter is required");
  });

  it("SECURITY: should reject GET /api/branch when user does not have access to the project", async () => {
    // Tenant A (Victim)
    const victim = await createTestUser({ name: "Victim Tenant" });
    tracker.userIds.push(victim.user.id);

    const victimProject = await createTestProject(victim.user, undefined, { name: "Victim Secret Project" });
    tracker.projectIds.push(victimProject.id);

    // Tenant B (Attacker)
    const attacker = await createTestUser({ name: "Attacker Tenant" });
    tracker.userIds.push(attacker.user.id);

    const req = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/branch?projectId=${victimProject.id}`,
      token: attacker.token,
      searchParams: { projectId: victimProject.id },
    });

    const res = await getBranches(req);
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.error).toContain("Forbidden");
  });

  it("should clear secrets on a branch and delete branch", async () => {
    const { user, token } = await createTestUser();
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Branch Clear Project" });
    tracker.projectIds.push(project.id);

    const branch = await createTestBranch(user, project.id, { name: "test-clear-branch" });

    // 1. Clear branch secrets
    const clearReq = createMockRequest({
      method: "POST",
      url: `http://localhost:3000/api/branch?operation=clear&branchId=${branch.id}`,
      token,
      searchParams: { operation: "clear", branchId: branch.id },
    });

    const clearRes = await handleBranchPost(clearReq);
    expect(clearRes.status).toBe(200);

    // 2. Delete branch
    const deleteReq = createMockRequest({
      method: "DELETE",
      url: `http://localhost:3000/api/branch?id=${branch.id}`,
      token,
      searchParams: { id: branch.id },
    });

    const deleteRes = await deleteBranch(deleteReq);
    expect(deleteRes.status).toBe(200);

    const dbBranch = await prisma.branch.findUnique({ where: { id: branch.id } });
    expect(dbBranch).toBeNull();
  });
});
