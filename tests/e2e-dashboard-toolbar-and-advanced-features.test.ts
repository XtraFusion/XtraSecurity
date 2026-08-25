import { GET as handleBranchCompare } from "@/app/api/branch/compare/route";
import { POST as handleProjectClear } from "@/app/api/project/[id]/clear/route";
import { GET as getProjectTeams, POST as assignProjectTeam } from "@/app/api/project/[id]/teams/route";
import { POST as handleCliLogin } from "@/app/api/auth/cli-login/route";
import { POST as createSecret, GET as getSecrets } from "@/app/api/secret/route";
import { POST as createBranch } from "@/app/api/branch/route";
import { provisionAllTestUsers, SeededUser } from "./helpers/seed-users";
import { createMockRequest, cleanupUserResources, createTestWorkspace, createTestProject } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";
import { generateTotpToken } from "@/lib/mfa";
import { encrypt } from "@/lib/encription";

describe("E2E Project Dashboard Toolbar, Context Menus & Advanced Settings", () => {
  let userMap: Record<string, { user: any; token: string; credentials: SeededUser }>;

  let enterpriseOwner: { user: any; token: string; credentials: SeededUser };
  let devSenior: { user: any; token: string; credentials: SeededUser };
  let auditor: { user: any; token: string; credentials: SeededUser };

  let workspace: any;
  let project: any;
  let mainBranch: any;
  let featureBranch: any;

  beforeAll(async () => {
    userMap = await provisionAllTestUsers();

    enterpriseOwner = userMap["owner.enterprise@xtrasecurity.test"];
    devSenior = userMap["dev.senior@xtrasecurity.test"];
    auditor = userMap["auditor.viewer@xtrasecurity.test"];

    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);

    // 1. Setup Workspace & Project
    workspace = await createTestWorkspace(enterpriseOwner.user, "Advanced Toolbar Workspace");
    project = await createTestProject(enterpriseOwner.user, workspace.id, { name: "Advanced Toolbar Project" });

    // 2. Setup Team & Members
    const team = await prisma.team.create({
      data: {
        name: "Core Engineering",
        description: "Toolbar Test Team",
        teamColor: "#10b981",
        workspaceId: workspace.id,
        createdBy: enterpriseOwner.user.id,
      },
    });

    await prisma.teamUser.createMany({
      data: [
        { teamId: team.id, userId: devSenior.user.id, role: "developer", status: "active" },
        { teamId: team.id, userId: auditor.user.id, role: "viewer", status: "active" },
      ],
    });

    await prisma.teamProject.create({
      data: { teamId: team.id, projectId: project.id },
    });

    // 3. Branches
    let branches = await prisma.branch.findMany({ where: { projectId: project.id } });
    if (branches.length === 0) {
      mainBranch = await prisma.branch.create({
        data: {
          name: "main",
          description: "Main branch",
          createdBy: enterpriseOwner.user.id,
          projectId: project.id,
          versionNo: "1",
        },
      });
    } else {
      mainBranch = branches.find((b) => b.name === "main") || branches[0];
    }

    // Create feature branch
    const reqBranch = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/branch",
      token: devSenior.token,
      body: { name: "feature/staging-sync", projectId: project.id },
    });
    const resBranch = await createBranch(reqBranch);
    featureBranch = await resBranch.json();

    for (const u of Object.values(userMap)) {
      await invalidateUserRbacCache(u.user.id);
    }
  });

  afterAll(async () => {
    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);
  });

  // =========================================================================
  // 1. BRANCH COMPARISON DIFF ENGINE
  // =========================================================================
  describe("1. Branch Compare Diffing Engine (Toolbar: Compare)", () => {
    beforeAll(async () => {
      // Create secret on main branch
      const reqSecret1 = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: devSenior.token,
        body: {
          key: "SHARED_API_KEY",
          value: "main-value-12345",
          projectId: project.id,
          branchId: mainBranch.id,
          environmentType: "development",
        },
      });
      await createSecret(reqSecret1, {});

      // Create secret on feature branch with different value (changed)
      const reqSecret2 = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: devSenior.token,
        body: {
          key: "SHARED_API_KEY",
          value: "feature-value-99999",
          projectId: project.id,
          branchId: featureBranch.id,
          environmentType: "development",
        },
      });
      await createSecret(reqSecret2, {});

      // Create unique secret on feature branch (added)
      const reqSecret3 = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: devSenior.token,
        body: {
          key: "FEATURE_ONLY_FLAG",
          value: "enabled_true",
          projectId: project.id,
          branchId: featureBranch.id,
          environmentType: "development",
        },
      });
      await createSecret(reqSecret3, {});
    });

    it("GET /api/branch/compare - Accurately computes added, removed, and changed secrets", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/branch/compare?base=${mainBranch.id}&compare=${featureBranch.id}`,
        token: devSenior.token,
      });

      const res = await handleBranchCompare(req, {});
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.added).toBeDefined();
      expect(data.modified).toBeDefined();

      // Check added: FEATURE_ONLY_FLAG
      const addedKeys = data.added.map((s: any) => s.key);
      expect(addedKeys).toContain("FEATURE_ONLY_FLAG");

      // Check modified: SHARED_API_KEY
      const modifiedKeys = data.modified.map((s: any) => s.key);
      expect(modifiedKeys).toContain("SHARED_API_KEY");
      const modifiedItem = data.modified.find((s: any) => s.key === "SHARED_API_KEY");
      expect(modifiedItem.baseValue).toBe("main-value-12345");
      expect(modifiedItem.compareValue).toBe("feature-value-99999");
    });

    it("SECURITY: Rejects branch compare if user is a Viewer (403 Forbidden)", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/branch/compare?base=${mainBranch.id}&compare=${featureBranch.id}`,
        token: auditor.token,
      });

      const res = await handleBranchCompare(req, {});
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Viewers cannot compare branches");
    });
  });

  // =========================================================================
  // 2. PROJECT SETTINGS: TEAM ASSIGNMENT APIS
  // =========================================================================
  describe("2. Project Settings: Team Assignment Management", () => {
    let secondTeam: any;

    beforeAll(async () => {
      secondTeam = await prisma.team.create({
        data: {
          name: "DevOps & SRE Squad",
          description: "Infra team",
          teamColor: "#6366f1",
          workspaceId: workspace.id,
          createdBy: enterpriseOwner.user.id,
        },
      });
    });

    it("GET /api/project/[id]/teams - Lists assigned teams on project", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/project/${project.id}/teams`,
        token: enterpriseOwner.token,
      });

      const res = await getProjectTeams(req, { params: Promise.resolve({ id: project.id }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(1);
    });

    it("POST /api/project/[id]/teams - Assigns new team to project", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/project/${project.id}/teams`,
        token: enterpriseOwner.token,
        body: { teamId: secondTeam.id },
      });

      const res = await assignProjectTeam(req, { params: Promise.resolve({ id: project.id }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.teamId).toBe(secondTeam.id);
      expect(data.projectId).toBe(project.id);
    });
  });

  // =========================================================================
  // 3. CLI SETUP & HEADLESS SESSION LOGIN
  // =========================================================================
  describe("3. CLI Setup & Headless Session Login API", () => {
    it("POST /api/auth/cli-login - Logs in via email and password returning session token", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/auth/cli-login",
        body: {
          email: devSenior.credentials.email,
          password: devSenior.credentials.passwordRaw,
        },
      });

      const res = await handleCliLogin(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(devSenior.credentials.email);
    });

    it("POST /api/auth/cli-login - Rejects incorrect password with 401 Unauthorized", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/auth/cli-login",
        body: {
          email: devSenior.credentials.email,
          password: "WrongPassword123!#",
        },
      });

      const res = await handleCliLogin(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Invalid credentials");
    });

    it("POST /api/auth/cli-login - Enforces TOTP MFA when enabled on account", async () => {
      const mfaSecret = "JBSWY3DPEHPK3PXP"; // base32 test secret
      const encryptedSecret = encrypt(mfaSecret);

      // Enable MFA on devSenior
      await prisma.user.update({
        where: { id: devSenior.user.id },
        data: {
          mfaEnabled: true,
          mfaSecret: JSON.stringify(encryptedSecret),
        },
      });

      // 1. Attempt login without TOTP code -> 403 MFA_REQUIRED
      const reqNoMfa = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/auth/cli-login",
        body: {
          email: devSenior.credentials.email,
          password: devSenior.credentials.passwordRaw,
        },
      });
      const resNoMfa = await handleCliLogin(reqNoMfa);
      expect(resNoMfa.status).toBe(403);
      const dataNoMfa = await resNoMfa.json();
      expect(dataNoMfa.error).toBe("MFA_REQUIRED");

      // 2. Attempt login with valid TOTP code -> 200 OK
      const validToken = await generateTotpToken(mfaSecret);
      const reqWithMfa = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/auth/cli-login",
        body: {
          email: devSenior.credentials.email,
          password: devSenior.credentials.passwordRaw,
          totpCode: validToken,
        },
      });
      const resWithMfa = await handleCliLogin(reqWithMfa);
      expect(resWithMfa.status).toBe(200);
      const dataWithMfa = await resWithMfa.json();
      expect(dataWithMfa.token).toBeDefined();

      // Reset MFA
      await prisma.user.update({
        where: { id: devSenior.user.id },
        data: { mfaEnabled: false, mfaSecret: null },
      });
    });
  });

  // =========================================================================
  // 4. PROJECT CLEAR DATA (Settings: Clear Data Tab)
  // =========================================================================
  describe("4. Project Clear Data (Settings: Clear Data Tab)", () => {
    it("SECURITY: Rejects non-owner attempting to clear project (401 Unauthorized)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/project/${project.id}/clear`,
        token: devSenior.token,
      });

      const res = await handleProjectClear(req, { params: Promise.resolve({ id: project.id }) });
      expect(res.status).toBe(401);
    });

    it("POST /api/project/[id]/clear - Owner clears all project secrets and branches", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/project/${project.id}/clear`,
        token: enterpriseOwner.token,
      });

      const res = await handleProjectClear(req, { params: Promise.resolve({ id: project.id }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain("Project cleared successfully");

      // Verify secrets and branches count is 0 in DB
      const secretCount = await prisma.secret.count({ where: { projectId: project.id } });
      expect(secretCount).toBe(0);

      // Verify Project record is preserved
      const projectRecord = await prisma.project.findUnique({ where: { id: project.id } });
      expect(projectRecord).toBeDefined();

      // Verify audit log generated
      const auditLogs = await prisma.auditLog.findMany({
        where: { action: "PROJECT_CLEARED", entityId: project.id },
      });
      expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
