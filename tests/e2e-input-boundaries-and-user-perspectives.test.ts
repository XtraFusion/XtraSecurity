import { POST as handleBranchPost, GET as getBranches } from "@/app/api/branch/route";
import { POST as createProject } from "@/app/api/project/route";
import { POST as createWorkspace } from "@/app/api/workspace/route";
import { POST as createSecret } from "@/app/api/secret/route";
import { provisionAllTestUsers, SeededUser } from "./helpers/seed-users";
import { createMockRequest, cleanupUserResources, createTestWorkspace, createTestProject } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";

describe("E2E User Perspective: Strict Input Validation, Length Limits & Security Boundaries", () => {
  let userMap: Record<string, { user: any; token: string; credentials: SeededUser }>;

  let enterpriseOwner: { user: any; token: string };
  let devSenior: { user: any; token: string };

  let workspace: any;
  let project: any;

  beforeAll(async () => {
    userMap = await provisionAllTestUsers();

    enterpriseOwner = userMap["owner.enterprise@xtrasecurity.test"];
    devSenior = userMap["dev.senior@xtrasecurity.test"];

    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);

    // Setup Baseline Workspace & Project
    workspace = await createTestWorkspace(enterpriseOwner.user, "Validation Security Workspace");
    project = await createTestProject(enterpriseOwner.user, workspace.id, { name: "Validation Core Project" });

    // Add developer to team
    const team = await prisma.team.create({
      data: {
        name: "Dev Squad",
        description: "Core devs",
        teamColor: "#3b82f6",
        workspaceId: workspace.id,
        createdBy: enterpriseOwner.user.id,
      },
    });

    await prisma.teamUser.create({
      data: { teamId: team.id, userId: devSenior.user.id, role: "developer", status: "active" },
    });

    await prisma.teamProject.create({
      data: { teamId: team.id, projectId: project.id },
    });

    for (const u of Object.values(userMap)) {
      await invalidateUserRbacCache(u.user.id);
    }
  });

  afterAll(async () => {
    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);
  });

  // =========================================================================
  // 1. BRANCH NAME BOUNDARIES & SECURITY CHECKS
  // =========================================================================
  describe("1. Branch Name Input Boundaries & Sanitization", () => {
    it("REJECTS excessively long 10,000-character branch name (400 Bad Request)", async () => {
      const longBranchName = "feature/" + "a".repeat(10000);
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/branch",
        token: devSenior.token,
        body: { name: longBranchName, projectId: project.id },
      });
      const res = await handleBranchPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("cannot exceed 100 characters");
    });

    it("REJECTS whitespace-only or empty branch names (400 Bad Request)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/branch",
        token: devSenior.token,
        body: { name: "     ", projectId: project.id },
      });
      const res = await handleBranchPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("cannot be empty");
    });

    it("REJECTS branch names starting or ending with slashes (400 Bad Request)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/branch",
        token: devSenior.token,
        body: { name: "/feature/login/", projectId: project.id },
      });
      const res = await handleBranchPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("cannot start or end with a slash");
    });

    it("REJECTS path traversal and dangerous characters in branch names (400 Bad Request)", async () => {
      const maliciousNames = [
        "feature/../secret-branch",
        "feature//double-slash",
        "feature*wildcard",
        "feature?query",
        "feature~tilde",
        "feature^caret",
        "feature\\backslash",
      ];

      for (const name of maliciousNames) {
        const req = createMockRequest({
          method: "POST",
          url: "http://localhost:3000/api/branch",
          token: devSenior.token,
          body: { name, projectId: project.id },
        });
        const res = await handleBranchPost(req);
        expect(res.status).toBe(400);
      }
    });

    it("ACCEPTS valid, clean branch names (201 Created)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/branch",
        token: devSenior.token,
        body: { name: "feature/zero-knowledge-auth-v2", projectId: project.id },
      });
      const res = await handleBranchPost(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.name).toBe("feature/zero-knowledge-auth-v2");
    });
  });

  // =========================================================================
  // 2. PROJECT NAME BOUNDARIES
  // =========================================================================
  describe("2. Project Name Boundaries", () => {
    it("REJECTS 10,000-character project names (400 Bad Request)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/project",
        token: enterpriseOwner.token,
        body: { name: "Project " + "X".repeat(10000), workspaceId: workspace.id },
      });
      const res = await createProject(req, {});
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("cannot exceed 100 characters");
    });

    it("REJECTS empty or whitespace-only project names (400 Bad Request)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/project",
        token: enterpriseOwner.token,
        body: { name: "   ", workspaceId: workspace.id },
      });
      const res = await createProject(req, {});
      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // 3. WORKSPACE NAME BOUNDARIES
  // =========================================================================
  describe("3. Workspace Name Boundaries", () => {
    it("REJECTS 10,000-character workspace names (400 Bad Request)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/workspace",
        token: enterpriseOwner.token,
        body: { name: "Workspace " + "W".repeat(10000) },
      });
      const res = await createWorkspace(req, {});
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("cannot exceed 100 characters");
    });

    it("REJECTS whitespace-only workspace names (400 Bad Request)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/workspace",
        token: enterpriseOwner.token,
        body: { name: "   \t\n  " },
      });
      const res = await createWorkspace(req, {});
      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // 4. SECRET KEY & VALUE SIZE BOUNDARIES
  // =========================================================================
  describe("4. Secret Key & Value Size Boundaries", () => {
    it("REJECTS secret keys exceeding 256 characters (400 Bad Request)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: devSenior.token,
        body: {
          key: "KEY_" + "A".repeat(300),
          value: "payload",
          projectId: project.id,
          environmentType: "development",
        },
      });
      const res = await createSecret(req, {});
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("cannot exceed 256 characters");
    });

    it("REJECTS secret keys with spaces or illegal characters (400 Bad Request)", async () => {
      const invalidKeys = ["INVALID KEY WITH SPACES", "INVALID$KEY#123", "KEY/WITH/SLASHES"];
      for (const key of invalidKeys) {
        const req = createMockRequest({
          method: "POST",
          url: "http://localhost:3000/api/secret",
          token: devSenior.token,
          body: {
            key,
            value: "payload",
            projectId: project.id,
            environmentType: "development",
          },
        });
        const res = await createSecret(req, {});
        expect(res.status).toBe(400);
      }
    });

    it("REJECTS secret values exceeding 1MB payload limit (400 Bad Request)", async () => {
      const oversizedValue = "B".repeat(1024 * 1024 + 1024); // 1MB + 1KB
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: devSenior.token,
        body: {
          key: "OVERSIZED_SECRET_PAYLOAD",
          value: oversizedValue,
          projectId: project.id,
          environmentType: "development",
        },
      });
      const res = await createSecret(req, {});
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("exceeds maximum allowable size (1MB)");
    });
  });
});
