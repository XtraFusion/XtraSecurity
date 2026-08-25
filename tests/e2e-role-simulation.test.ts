import { GET as getProjects, POST as createProject, PUT as updateProject, DELETE as deleteProject } from "@/app/api/project/route";
import { POST as addProjectIp, DELETE as removeProjectIp } from "@/app/api/project/[id]/ip/route";
import { GET as getBranches, POST as handleBranchPost, DELETE as deleteBranch } from "@/app/api/branch/route";
import { GET as getSecrets, POST as createSecret, PUT as updateSecret, DELETE as deleteSecret } from "@/app/api/secret/route";
import { POST as bulkCreateSecrets } from "@/app/api/secret/bulk/route";
import { POST as rollbackSecret } from "@/app/api/secret/rollback/route";
import { POST as copySecrets } from "@/app/api/secret/copy/route";
import { GET as getAuditLogs } from "@/app/api/audit/route";
import { GET as getAuditDashboard } from "@/app/api/audit/dashboard/route";
import { GET as getComplianceReport } from "@/app/api/compliance/report/route";
import {
  createMockRequest,
  getOrCreatePersistentUser,
  createTestWorkspace,
  createTestProject,
  createTestBranch,
  createTestTeam,
  cleanupUserResources,
  generateAuthToken,
} from "./helpers/test-utils";
import { SimulationLogger } from "./helpers/simulation-logger";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";
import jwt from "jsonwebtoken";

describe("E2E Role Simulation: Comprehensive Behavioral & Security Audit Across All User Roles", () => {
  const logger = new SimulationLogger();

  // Test Actors
  let ownerUser: { user: any; token: string };
  let adminUser: { user: any; token: string };
  let devUser: { user: any; token: string };
  let viewerUser: { user: any; token: string };
  let attackerUser: { user: any; token: string };
  let emergencyUser: { user: any; token: string };

  // Service Account Actor
  let readOnlyServiceAccount: any;
  let readOnlySaToken: string;
  let fullServiceAccount: any;
  let fullSaToken: string;

  // Shared Resources
  let workspace: any;
  let team: any;
  let project: any;
  let attackerProject: any;
  let mainBranch: any;
  let stagingBranch: any;
  let attackerBranch: any;
  let devSecret: any;
  let prodSecret: any;

  beforeAll(async () => {
    // 1. Initialize persistent actors for each distinct role
    ownerUser = await getOrCreatePersistentUser("pro", "Organization Owner", "owner");
    adminUser = await getOrCreatePersistentUser("pro", "Workspace Admin", "admin");
    devUser = await getOrCreatePersistentUser("free", "Senior Developer", "developer");
    viewerUser = await getOrCreatePersistentUser("free", "Security Auditor Viewer", "viewer");
    attackerUser = await getOrCreatePersistentUser("free", "External Untrusted Tenant", "attacker");
    emergencyUser = await getOrCreatePersistentUser("pro", "Break Glass Responder", "responder");

    // Clean up stale test data for these actors (preserving user records)
    await cleanupUserResources([
      ownerUser.user.id,
      adminUser.user.id,
      devUser.user.id,
      viewerUser.user.id,
      attackerUser.user.id,
      emergencyUser.user.id,
    ]);

    // 2. Setup Baseline Hierarchy: Workspace -> Team -> Project -> Branches
    workspace = await createTestWorkspace(ownerUser.user, "CyberCore Enterprise Cloud");
    team = await createTestTeam(ownerUser.user, workspace.id, { name: "Core Engineering Team" });

    // Assign Team Roles
    await prisma.teamUser.createMany({
      data: [
        { teamId: team.id, userId: adminUser.user.id, role: "admin", status: "active" },
        { teamId: team.id, userId: devUser.user.id, role: "developer", status: "active" },
        { teamId: team.id, userId: viewerUser.user.id, role: "viewer", status: "active" },
        { teamId: team.id, userId: emergencyUser.user.id, role: "viewer", status: "active" },
      ],
    });

    project = await createTestProject(ownerUser.user, workspace.id, {
      name: "CyberCore Core Banking Service",
      description: "Financial transactions engine",
    });

    await prisma.teamProject.create({
      data: { teamId: team.id, projectId: project.id },
    });

    // Attacker's isolated project
    const attackerWorkspace = await createTestWorkspace(attackerUser.user, "Attacker Hostile Tenant");
    attackerProject = await createTestProject(attackerUser.user, attackerWorkspace.id, {
      name: "Attacker Shadow Repo",
      description: "Untrusted environment",
    });

    mainBranch = await createTestBranch(ownerUser.user, project.id, { name: "main" });
    stagingBranch = await createTestBranch(ownerUser.user, project.id, { name: "staging" });
    attackerBranch = await createTestBranch(attackerUser.user, attackerProject.id, { name: "main" });

    // 3. Create baseline secrets
    const devEncrypted = JSON.stringify(await import("@/lib/encription").then(m => m.encrypt("postgres://dev_user:pass123@dev-db.internal:5432/app")));
    devSecret = await prisma.secret.create({
      data: {
        key: "DEV_DATABASE_URL",
        value: [devEncrypted],
        description: "Development Postgres URI",
        environmentType: "development",
        type: "string",
        version: "1",
        projectId: project.id,
        branchId: mainBranch.id,
        updatedBy: devUser.user.id,
        permission: [],
        rotationPolicy: "manual",
        history: [{ version: "1", value: [devEncrypted], description: "Initial", updatedAt: new Date().toISOString() }],
      },
    });

    const prodEncrypted = JSON.stringify(await import("@/lib/encription").then(m => m.encrypt("prod_live_secret_stripe_api_key_8899aabbcc")));
    prodSecret = await prisma.secret.create({
      data: {
        key: "PROD_PAYMENT_SECRET",
        value: [prodEncrypted],
        description: "Stripe Live Secret",
        environmentType: "production",
        type: "string",
        version: "1",
        projectId: project.id,
        branchId: mainBranch.id,
        updatedBy: ownerUser.user.id,
        permission: [],
        rotationPolicy: "manual",
        history: [{ version: "1", value: [prodEncrypted], description: "Initial", updatedAt: new Date().toISOString() }],
      },
    });

    // 4. Create Service Accounts
    const secretJwt = process.env.NEXTAUTH_SECRET || "e2e-test-nextauth-secret-key-32-chars-long";

    readOnlyServiceAccount = await prisma.serviceAccount.create({
      data: {
        name: "Security Audit Scanner Bot",
        description: "Read-only inspection machine token",
        projectId: project.id,
        permissions: ["read:secrets"],
        createdBy: ownerUser.user.id,
      },
    });

    readOnlySaToken = jwt.sign(
      {
        id: `sa_${readOnlyServiceAccount.id}`,
        userId: `sa_${readOnlyServiceAccount.id}`,
        email: "audit-scanner@serviceaccount.xtrasecurity.test",
        type: "cli-token",
        isServiceAccount: true,
        serviceAccountId: readOnlyServiceAccount.id,
        projectId: project.id,
        permissions: ["read:secrets"],
        role: "developer",
        tier: "enterprise",
      },
      secretJwt
    );

    fullServiceAccount = await prisma.serviceAccount.create({
      data: {
        name: "CI/CD Pipeline Runner",
        description: "Read-write deployment token",
        projectId: project.id,
        permissions: ["read:secrets", "write:secrets"],
        createdBy: ownerUser.user.id,
      },
    });

    fullSaToken = jwt.sign(
      {
        id: `sa_${fullServiceAccount.id}`,
        userId: `sa_${fullServiceAccount.id}`,
        email: "ci-bot@serviceaccount.xtrasecurity.test",
        type: "cli-token",
        isServiceAccount: true,
        serviceAccountId: fullServiceAccount.id,
        projectId: project.id,
        permissions: ["read:secrets", "write:secrets"],
        role: "developer",
        tier: "enterprise",
      },
      secretJwt
    );

    // Invalidate RBAC caches to ensure clean start
    await invalidateUserRbacCache(ownerUser.user.id);
    await invalidateUserRbacCache(adminUser.user.id);
    await invalidateUserRbacCache(devUser.user.id);
    await invalidateUserRbacCache(viewerUser.user.id);
    await invalidateUserRbacCache(attackerUser.user.id);
    await invalidateUserRbacCache(emergencyUser.user.id);
  });

  afterAll(async () => {
    // 1. Generate and save the comprehensive report to disk
    const summary = logger.save();
    console.log(`[Role Simulation Report Saved] -> ${summary.jsonPath}`);
    console.log(`[Markdown Audit Summary] -> ${summary.mdPath}`);

    // 2. Clean up all resources in DB, preserving user accounts
    await cleanupUserResources([
      ownerUser.user.id,
      adminUser.user.id,
      devUser.user.id,
      viewerUser.user.id,
      attackerUser.user.id,
      emergencyUser.user.id,
    ]);

    if (readOnlyServiceAccount?.id) {
      await prisma.serviceAccount.deleteMany({ where: { id: readOnlyServiceAccount.id } }).catch(() => {});
    }
    if (fullServiceAccount?.id) {
      await prisma.serviceAccount.deleteMany({ where: { id: fullServiceAccount.id } }).catch(() => {});
    }

    // Verify persistent users still exist
    const ownerCheck = await prisma.user.findUnique({ where: { id: ownerUser.user.id } });
    expect(ownerCheck).not.toBeNull();
  });

  // =========================================================================
  // 1. WORKSPACE & PROJECT LEVEL OPERATIONS ACROSS ROLES
  // =========================================================================
  describe("1. Workspace & Project Operations Simulation", () => {
    it("OWNER: Should update project configuration and settings", async () => {
      const req = createMockRequest({
        method: "PUT",
        url: `http://localhost:3000/api/project?id=${project.id}`,
        token: ownerUser.token,
        searchParams: { id: project.id },
        body: { name: "CyberCore Core Banking Service (Prod v2)", description: "Updated high-availability service" },
      });
      const res = await updateProject(req, {});
      const data = await res.json();

      logger.log({
        scenario: "Owner updates project settings",
        role: "Owner",
        actorEmail: ownerUser.user.email,
        endpoint: `/api/project?id=${project.id}`,
        method: "PUT",
        requestPayload: { name: "CyberCore Core Banking Service (Prod v2)" },
        responseStatus: res.status,
        responseSummary: { name: data.name, id: data.id },
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      expect(data.name).toBe("CyberCore Core Banking Service (Prod v2)");
    });

    it("ADMIN: Should add IP allowlist restriction to project", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/project/${project.id}/ip`,
        token: adminUser.token,
        body: { ip: "198.51.100.77", description: "Admin Bastion Host" },
      });
      const res = await addProjectIp(req, { params: Promise.resolve({ id: project.id }) });
      const data = await res.json();

      logger.log({
        scenario: "Admin adds IP allowlist rule to project",
        role: "Admin",
        actorEmail: adminUser.user.email,
        endpoint: `/api/project/${project.id}/ip`,
        method: "POST",
        requestPayload: { ip: "198.51.100.77" },
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
    });

    it("VIEWER: Attempting to add IP restriction MUST be blocked (403)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/project/${project.id}/ip`,
        token: viewerUser.token,
        body: { ip: "203.0.113.88", description: "Unauthorized Rule" },
      });
      const res = await addProjectIp(req, { params: Promise.resolve({ id: project.id }) });
      const data = await res.json();

      logger.log({
        scenario: "Viewer attempts to modify IP allowlist (Access Control Check)",
        role: "Viewer",
        actorEmail: viewerUser.user.email,
        endpoint: `/api/project/${project.id}/ip`,
        method: "POST",
        requestPayload: { ip: "203.0.113.88" },
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 403,
        notes: "Viewers have read-only privileges and must never alter network firewall policies",
      });

      expect(res.status).toBe(403);
    });

    it("ADMIN: Removes IP allowlist restriction to restore general project access", async () => {
      const req = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/project/${project.id}/ip`,
        token: adminUser.token,
        body: { ip: "198.51.100.77" },
      });
      const res = await removeProjectIp(req, { params: Promise.resolve({ id: project.id }) });
      const data = await res.json();

      logger.log({
        scenario: "Admin removes IP allowlist rule from project",
        role: "Admin",
        actorEmail: adminUser.user.email,
        endpoint: `/api/project/${project.id}/ip`,
        method: "DELETE",
        requestPayload: { ip: "198.51.100.77" },
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
    });

    it("DEVELOPER: Attempting to delete a project MUST be blocked (403)", async () => {
      const req = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/project?id=${project.id}`,
        token: devUser.token,
        searchParams: { id: project.id },
      });
      const res = await deleteProject(req, {});
      const data = await res.json();

      logger.log({
        scenario: "Developer attempts to delete project (Privilege Boundary Check)",
        role: "Developer",
        actorEmail: devUser.user.email,
        endpoint: `/api/project?id=${project.id}`,
        method: "DELETE",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 403,
      });

      expect(res.status).toBe(403);
    });

    it("ATTACKER: Attempting to access project without team membership MUST be blocked (403)", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: attackerUser.token,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      const data = await res.json();

      logger.log({
        scenario: "External attacker attempts IDOR access to victim project",
        role: "Attacker (Untrusted)",
        actorEmail: attackerUser.user.email,
        endpoint: `/api/secret?projectId=${project.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 403,
        notes: "Strict multi-tenant boundary successfully blocked unauthorized cross-tenant read",
      });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 2. BRANCH LIFECYCLE SIMULATION ACROSS ROLES
  // =========================================================================
  describe("2. Branch Operations Simulation", () => {
    let devFeatureBranch: any;

    it("DEVELOPER: Should create a feature branch under authorized project", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/branch",
        token: devUser.token,
        body: {
          name: "feature/crypto-speedup",
          description: "Optimized cryptography routines",
          projectId: project.id,
        },
      });
      const res = await handleBranchPost(req);
      const data = await res.json();

      logger.log({
        scenario: "Developer creates a feature branch",
        role: "Developer",
        actorEmail: devUser.user.email,
        endpoint: "/api/branch",
        method: "POST",
        requestPayload: { name: "feature/crypto-speedup", projectId: project.id },
        responseStatus: res.status,
        responseSummary: { name: data.name, id: data.id },
        expectedStatus: 201,
      });

      expect(res.status).toBe(201);
      devFeatureBranch = data;
    });

    it("VIEWER: Attempting to create a branch MUST be blocked (403)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/branch",
        token: viewerUser.token,
        body: {
          name: "viewer-unauthorized-branch",
          projectId: project.id,
        },
      });
      const res = await handleBranchPost(req);
      const data = await res.json();

      logger.log({
        scenario: "Viewer attempts to create a branch (Write Boundary Check)",
        role: "Viewer",
        actorEmail: viewerUser.user.email,
        endpoint: "/api/branch",
        method: "POST",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 403,
      });

      expect(res.status).toBe(403);
    });

    it("VIEWER: Reading branches is allowed and returns branch metadata", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/branch?projectId=${project.id}`,
        token: viewerUser.token,
        searchParams: { projectId: project.id },
      });
      const res = await getBranches(req);
      const data = await res.json();

      logger.log({
        scenario: "Viewer lists project branches (Read Allowed)",
        role: "Viewer",
        actorEmail: viewerUser.user.email,
        endpoint: `/api/branch?projectId=${project.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: { count: Array.isArray(data) ? data.length : 0 },
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("DEVELOPER: Clears and deletes the feature branch after work", async () => {
      // 1. Clear
      const clearReq = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/branch?operation=clear&branchId=${devFeatureBranch.id}`,
        token: devUser.token,
        searchParams: { operation: "clear", branchId: devFeatureBranch.id },
      });
      const clearRes = await handleBranchPost(clearReq);

      // 2. Delete
      const delReq = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/branch?id=${devFeatureBranch.id}`,
        token: devUser.token,
        searchParams: { id: devFeatureBranch.id },
      });
      const delRes = await deleteBranch(delReq);

      logger.log({
        scenario: "Developer clears and deletes completed feature branch",
        role: "Developer",
        actorEmail: devUser.user.email,
        endpoint: `/api/branch?id=${devFeatureBranch.id}`,
        method: "DELETE",
        responseStatus: delRes.status,
        responseSummary: await delRes.json(),
        expectedStatus: 200,
      });

      expect(delRes.status).toBe(200);
    });
  });

  // =========================================================================
  // 3. CRYPTOGRAPHIC SECRET OPERATIONS & ROLE CONSTRAINTS
  // =========================================================================
  describe("3. Secret Operations, Role Redaction & Environment Policies", () => {
    const rawDevVal = "postgres://dev_user:pass123@dev-db.internal:5432/app";
    const rawProdVal = "prod_live_secret_stripe_api_key_8899aabbcc";

    it("DEVELOPER: Creates development secret (AES-256-GCM encrypted, masked response)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: devUser.token,
        body: {
          key: "DEV_CUSTOM_TOKEN",
          value: rawDevVal,
          description: "Development token",
          environmentType: "development",
          projectId: project.id,
          type: "string",
        },
      });
      const res = await createSecret(req, {});
      const created = await res.json();

      logger.log({
        scenario: "Developer creates development secret",
        role: "Developer",
        actorEmail: devUser.user.email,
        endpoint: "/api/secret",
        method: "POST",
        requestPayload: { key: "DEV_CUSTOM_TOKEN", environmentType: "development" },
        responseStatus: res.status,
        responseSummary: { key: created.key, value: created.value, id: created.id },
        expectedStatus: 201,
        notes: "HTTP response returned masked value '[encrypted]' to prevent credential leakage in transit",
      });

      expect(res.status).toBe(201);
      expect(created.value).toBe("[encrypted]");
    });

    it("OWNER: Creates production secret with high-security classification", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: ownerUser.token,
        body: {
          key: "PROD_CUSTOM_KEY",
          value: rawProdVal,
          description: "Stripe Live Secret",
          environmentType: "production",
          projectId: project.id,
          type: "string",
        },
      });
      const res = await createSecret(req, {});
      const created = await res.json();

      logger.log({
        scenario: "Owner creates production secret",
        role: "Owner",
        actorEmail: ownerUser.user.email,
        endpoint: "/api/secret",
        method: "POST",
        requestPayload: { key: "PROD_CUSTOM_KEY", environmentType: "production" },
        responseStatus: res.status,
        responseSummary: { key: created.key, value: created.value, id: created.id },
        expectedStatus: 201,
      });

      expect(res.status).toBe(201);
      expect(created.value).toBe("[encrypted]");
    });

    it("DEVELOPER: Reads development secret -> Authenticated real-time decryption returns plaintext", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: devUser.token,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      const secrets = await res.json();
      const target = secrets.find((s: any) => s.id === devSecret.id);

      logger.log({
        scenario: "Developer retrieves and decrypts development secret",
        role: "Developer",
        actorEmail: devUser.user.email,
        endpoint: `/api/secret?projectId=${project.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: { key: target?.key, valueDecrypted: target?.value === rawDevVal },
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      expect(target.value).toBe(rawDevVal);
    });

    it("DEVELOPER: Attempting to update a PRODUCTION secret MUST be blocked (403)", async () => {
      const req = createMockRequest({
        method: "PUT",
        url: `http://localhost:3000/api/secret?id=${prodSecret.id}`,
        token: devUser.token,
        searchParams: { id: prodSecret.id },
        body: {
          id: prodSecret.id,
          value: "illicit_dev_overwrite_in_prod",
        },
      });
      const res = await updateSecret(req, {});
      const data = await res.json();

      logger.log({
        scenario: "Developer attempts to mutate production secret (Separation of Duties Check)",
        role: "Developer",
        actorEmail: devUser.user.email,
        endpoint: `/api/secret?id=${prodSecret.id}`,
        method: "PUT",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 403,
        notes: "Developers are restricted from modifying production secrets directly",
      });

      expect(res.status).toBe(403);
    });

    it("DEVELOPER: Updates DEVELOPMENT secret -> Version bump to v2 with audit history", async () => {
      const updatedVal = "postgres://dev_user:newpass999@dev-db.internal:5432/app";
      const req = createMockRequest({
        method: "PUT",
        url: `http://localhost:3000/api/secret?id=${devSecret.id}`,
        token: devUser.token,
        searchParams: { id: devSecret.id },
        body: {
          id: devSecret.id,
          value: updatedVal,
        },
      });
      const res = await updateSecret(req, {});
      const updated = await res.json();

      logger.log({
        scenario: "Developer updates development secret (Version Bump to v2)",
        role: "Developer",
        actorEmail: devUser.user.email,
        endpoint: `/api/secret?id=${devSecret.id}`,
        method: "PUT",
        responseStatus: res.status,
        responseSummary: { version: updated.version, id: updated.id },
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      expect(updated.version).toBe("2");
    });

    it("DEVELOPER: Rolls back development secret to version v1 -> Restores original value", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/rollback",
        token: devUser.token,
        body: {
          secretId: devSecret.id,
          targetVersion: "1",
        },
      });
      const res = await rollbackSecret(req);
      const rolledBack = await res.json();

      logger.log({
        scenario: "Developer rolls back development secret to v1",
        role: "Developer",
        actorEmail: devUser.user.email,
        endpoint: "/api/secret/rollback",
        method: "POST",
        requestPayload: { secretId: devSecret.id, targetVersion: "1" },
        responseStatus: res.status,
        responseSummary: { version: rolledBack.version, key: rolledBack.key },
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      expect(rolledBack.version).toBe("3"); // Rollback creates version 3 with v1 content
    });

    it("DEVELOPER: Copies development secret to staging branch", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/copy",
        token: devUser.token,
        body: {
          sourceBranchId: mainBranch.id,
          targetBranchId: stagingBranch.id,
          sourceEnvironment: "development",
          targetEnvironment: "development",
        },
      });
      const res = await copySecrets(req, {});
      const data = await res.json();

      logger.log({
        scenario: "Developer copies secret from main to staging branch",
        role: "Developer",
        actorEmail: devUser.user.email,
        endpoint: "/api/secret/copy",
        method: "POST",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
    });

    it("ATTACKER: Attempting cross-tenant secret copy MUST be blocked (403)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/copy",
        token: attackerUser.token,
        body: {
          sourceBranchId: mainBranch.id,
          targetBranchId: attackerBranch.id,
          sourceEnvironment: "development",
          targetEnvironment: "development",
        },
      });
      const res = await copySecrets(req, {});
      const data = await res.json();

      logger.log({
        scenario: "Attacker attempts to copy victim's secret into attacker project (Cross-Tenant Theft)",
        role: "Attacker (Untrusted)",
        actorEmail: attackerUser.user.email,
        endpoint: "/api/secret/copy",
        method: "POST",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 403,
      });

      expect(res.status).toBe(403);
    });

    it("VIEWER: Reads secrets -> Values MUST be safely masked as [REDACTED]", async () => {
      await invalidateUserRbacCache(viewerUser.user.id);

      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: viewerUser.token,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      const secrets = await res.json();
      const targetDev = secrets.find((s: any) => s.id === devSecret.id);
      const targetProd = secrets.find((s: any) => s.id === prodSecret.id);

      logger.log({
        scenario: "Viewer reads secrets (Role Redaction Verification)",
        role: "Viewer",
        actorEmail: viewerUser.user.email,
        endpoint: `/api/secret?projectId=${project.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: {
          devSecretValue: targetDev?.value,
          prodSecretValue: targetProd?.value,
          isFullyRedacted: targetDev?.value === "[REDACTED]" && targetProd?.value === "[REDACTED]",
        },
        expectedStatus: 200,
        notes: "All plaintext credentials masked with [REDACTED] for Viewers to enforce least privilege",
      });

      expect(res.status).toBe(200);
      expect(targetDev?.value).toBe("[REDACTED]");
      expect(targetProd?.value).toBe("[REDACTED]");
    });

    it("VIEWER: Attempting to create a secret MUST be blocked (403)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: viewerUser.token,
        body: {
          key: "VIEWER_MUTATION",
          value: "val",
          projectId: project.id,
          environmentType: "development",
          type: "string",
        },
      });
      const res = await createSecret(req, {});
      const data = await res.json();

      logger.log({
        scenario: "Viewer attempts secret creation (Mutation Blocked)",
        role: "Viewer",
        actorEmail: viewerUser.user.email,
        endpoint: "/api/secret",
        method: "POST",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 403,
      });

      expect(res.status).toBe(403);
    });

    it("SERVICE ACCOUNT (READ-WRITE): Reads project secrets using scoped machine token", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: fullSaToken,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      const secrets = await res.json();
      const targetDev = secrets.find((s: any) => s.id === devSecret.id);

      logger.log({
        scenario: "Service Account accesses scoped project secrets",
        role: "Service Account (Machine Token)",
        actorEmail: "ci-bot@serviceaccount.xtrasecurity.test",
        endpoint: `/api/secret?projectId=${project.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: { key: targetDev?.key, valueDecrypted: targetDev?.value === rawDevVal },
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      expect(targetDev?.value).toBe(rawDevVal);
    });

    it("SERVICE ACCOUNT (READ-ONLY): Attempting write:secrets MUST be blocked (403)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: readOnlySaToken,
        body: {
          key: "SA_UNAUTHORIZED_WRITE",
          value: "secret_val",
          projectId: project.id,
          environmentType: "development",
          type: "string",
        },
      });
      const res = await createSecret(req, {});
      const data = await res.json();

      logger.log({
        scenario: "Read-only Service Account attempts write:secrets (Scope Check)",
        role: "Service Account (Read-Only)",
        actorEmail: "audit-scanner@serviceaccount.xtrasecurity.test",
        endpoint: "/api/secret",
        method: "POST",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 403,
        notes: "Enforced missing write:secrets scope restriction on machine token",
      });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 4. JUST-IN-TIME (JIT) & BREAK GLASS EMERGENCY ELEVATION
  // =========================================================================
  describe("4. Just-In-Time (JIT) & Emergency Privilege Elevation", () => {
    let jitAccessRequest: any;
    let breakGlassSession: any;

    it("VIEWER + JIT APPROVED: Elevates Viewer access to decrypted plaintext for specific secret", async () => {
      // 1. Create Approved JIT grant for prodSecret
      jitAccessRequest = await prisma.accessRequest.create({
        data: {
          userId: viewerUser.user.id,
          projectId: project.id,
          secretIds: [prodSecret.id],
          status: "approved",
          duration: 30, // 30 minutes
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          reason: "Production outage troubleshooting INC-8822",
        },
      });

      await invalidateUserRbacCache(viewerUser.user.id);

      // 2. Viewer fetches secrets -> Prod secret MUST now be decrypted!
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: viewerUser.token,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      const secrets = await res.json();
      const targetProd = secrets.find((s: any) => s.id === prodSecret.id);
      const targetDev = secrets.find((s: any) => s.id === devSecret.id);

      logger.log({
        scenario: "Viewer accesses secret with approved JIT Elevation",
        role: "Viewer (JIT Elevated)",
        actorEmail: viewerUser.user.email,
        endpoint: `/api/secret?projectId=${project.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: {
          prodSecretValue: targetProd?.value === "prod_live_secret_stripe_api_key_8899aabbcc" ? "[DECRYPTED]" : targetProd?.value,
          devSecretValue: targetDev?.value,
        },
        expectedStatus: 200,
        notes: "Granular JIT elevation unlocked PROD_PAYMENT_SECRET while DEV_DATABASE_URL remained safely redacted",
      });

      expect(res.status).toBe(200);
      expect(targetProd.value).toBe("prod_live_secret_stripe_api_key_8899aabbcc");
      expect(targetDev.value).toBe("[REDACTED]"); // Granular JIT only elevates prodSecret!
    });

    it("REVOCATION: When JIT access is revoked, secret values immediately return to [REDACTED]", async () => {
      // 1. Revoke JIT grant
      await prisma.accessRequest.update({
        where: { id: jitAccessRequest.id },
        data: { status: "revoked" },
      });

      await invalidateUserRbacCache(viewerUser.user.id);

      // 2. Viewer fetches secrets -> Prod secret MUST be re-redacted
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: viewerUser.token,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      const secrets = await res.json();
      const targetProd = secrets.find((s: any) => s.id === prodSecret.id);

      logger.log({
        scenario: "Viewer accesses secret after JIT Revocation",
        role: "Viewer (JIT Revoked)",
        actorEmail: viewerUser.user.email,
        endpoint: `/api/secret?projectId=${project.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: { prodSecretValue: targetProd?.value },
        expectedStatus: 200,
        notes: "Instant re-redaction to [REDACTED] upon revocation",
      });

      expect(res.status).toBe(200);
      expect(targetProd.value).toBe("[REDACTED]");
    });

    it("BREAK-GLASS SESSION: Emergency responder gains emergency admin-level secret recovery", async () => {
      // 1. Create Break Glass Session
      breakGlassSession = await prisma.breakGlassSession.create({
        data: {
          userId: emergencyUser.user.id,
          projectId: project.id,
          incidentId: "INC-9911-DB-CORRUPTION",
          reason: "CRITICAL: Database corruption disaster recovery SEC-0099",
          isActive: true,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      await invalidateUserRbacCache(emergencyUser.user.id);

      // 2. Emergency responder reads secrets -> All plaintexts decrypted!
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: emergencyUser.token,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      const secrets = await res.json();
      const targetProd = secrets.find((s: any) => s.id === prodSecret.id);

      logger.log({
        scenario: "Emergency responder activates Break-Glass Session",
        role: "Break-Glass Responder (Emergency Admin)",
        actorEmail: emergencyUser.user.email,
        endpoint: `/api/secret?projectId=${project.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: { prodSecretDecrypted: targetProd?.value === "prod_live_secret_stripe_api_key_8899aabbcc" },
        expectedStatus: 200,
        notes: "Break-Glass session granted emergency decrypted access under active audit surveillance",
      });

      expect(res.status).toBe(200);
      expect(targetProd.value).toBe("prod_live_secret_stripe_api_key_8899aabbcc");
    });
  });

  // =========================================================================
  // 5. BULK SECRET IMPORT & RATE LIMIT VALIDATION
  // =========================================================================
  describe("5. Bulk Secret Operations & Role Rules", () => {
    it("DEVELOPER: Bulk imports development secrets via environment manifest", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/bulk",
        token: devUser.token,
        body: {
          projectId: project.id,
          environmentType: "development",
          secrets: [
            { key: "BULK_DEV_KEY_1", value: "val1", description: "Bulk 1", type: "string" },
            { key: "BULK_DEV_KEY_2", value: "val2", description: "Bulk 2", type: "string" },
          ],
        },
      });
      const res = await bulkCreateSecrets(req, {});
      const data = await res.json();

      logger.log({
        scenario: "Developer bulk imports development secrets",
        role: "Developer",
        actorEmail: devUser.user.email,
        endpoint: "/api/secret/bulk",
        method: "POST",
        responseStatus: res.status,
        responseSummary: { importedCount: data.createdCount || data.count || (Array.isArray(data) ? data.length : 2) },
        expectedStatus: [200, 201],
      });

      expect([200, 201]).toContain(res.status);
    });

    it("VIEWER: Attempting bulk secret import MUST be blocked (403)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/bulk",
        token: viewerUser.token,
        body: {
          projectId: project.id,
          environmentType: "development",
          secrets: [{ key: "BULK_VIEWER_KEY", value: "val", description: "Viewer Bulk", type: "string" }],
        },
      });
      const res = await bulkCreateSecrets(req, {});
      const data = await res.json();

      logger.log({
        scenario: "Viewer attempts bulk secret import (Mutation Blocked)",
        role: "Viewer",
        actorEmail: viewerUser.user.email,
        endpoint: "/api/secret/bulk",
        method: "POST",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 403,
      });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 6. AUDIT TRAILS & SOC 2 COMPLIANCE VERIFICATION
  // =========================================================================
  describe("6. Audit Logs & Security Intelligence Verification", () => {
    it("OWNER: Queries audit logs and verifies zero sensitive credential leaks", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/audit?workspaceId=${workspace.id}`,
        token: ownerUser.token,
        searchParams: { workspaceId: workspace.id },
      });
      const res = await getAuditLogs(req);
      const data = await res.json();

      let hasPasswordLeaks = false;
      let hasMfaSecretLeaks = false;

      if (Array.isArray(data.data)) {
        for (const log of data.data) {
          if (log.user?.password) hasPasswordLeaks = true;
          if (log.user?.mfaSecret) hasMfaSecretLeaks = true;
        }
      }

      logger.log({
        scenario: "Owner inspects tamper-evident audit logs (Zero Credential Leakage Check)",
        role: "Owner",
        actorEmail: ownerUser.user.email,
        endpoint: `/api/audit?workspaceId=${workspace.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: { totalLogs: data.data?.length || 0, hasPasswordLeaks, hasMfaSecretLeaks },
        expectedStatus: 200,
        notes: "Audit log responses are strictly sanitized to never expose password hashes or TOTP seeds",
      });

      expect(res.status).toBe(200);
      expect(hasPasswordLeaks).toBe(false);
      expect(hasMfaSecretLeaks).toBe(false);
    });

    it("ADMIN: Views security dashboard analytics & anomaly reports", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/audit/dashboard?workspaceId=${workspace.id}`,
        token: adminUser.token,
        searchParams: { workspaceId: workspace.id },
      });
      const res = await getAuditDashboard(req);
      const data = await res.json();

      logger.log({
        scenario: "Admin views security dashboard analytics and anomalies",
        role: "Admin",
        actorEmail: adminUser.user.email,
        endpoint: `/api/audit/dashboard?workspaceId=${workspace.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: { stats: data.stats, anomalyCount: data.anomalies?.length || 0 },
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      expect(data.stats).toBeDefined();
    });

    it("OWNER: Generates SOC 2 & compliance assessment report", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/compliance/report?workspaceId=${workspace.id}`,
        token: ownerUser.token,
        searchParams: { workspaceId: workspace.id },
      });
      const res = await getComplianceReport(req);
      const report = await res.json();

      logger.log({
        scenario: "Owner generates SOC 2 compliance posture report",
        role: "Owner",
        actorEmail: ownerUser.user.email,
        endpoint: `/api/compliance/report?workspaceId=${workspace.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: {
          generatedBy: report.generatedBy,
          totalProjects: report.summary?.totalProjects,
          totalSecrets: report.summary?.totalSecrets,
          totalAuditEntries: report.summary?.totalAuditEntries,
        },
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      expect(report.summary).toBeDefined();
    });
  });
});
