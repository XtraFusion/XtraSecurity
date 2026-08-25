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
} from "./helpers/test-utils";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encription";
import { invalidateUserRbacCache } from "@/lib/permissions";

describe("E2E Master Suite: Pro vs Free Tier Matrix & Production Security Scenarios", () => {
  let proUser: { user: any; token: string };
  let freeUser: { user: any; token: string };

  let proWorkspace: any;
  let freeWorkspace: any;

  let proProject: any;
  let freeProject: any;

  beforeAll(async () => {
    // 1. Initialize persistent Pro and Free users
    proUser = await getOrCreatePersistentUser("pro", "Pro Enterprise Owner");
    freeUser = await getOrCreatePersistentUser("free", "Free Tier Owner");

    // Clean up any stale artifacts from prior runs for these users (keeping users intact)
    await cleanupUserResources([proUser.user.id, freeUser.user.id]);
  });

  afterAll(async () => {
    // Clean up all resources created during tests, but DO NOT delete the users themselves
    await cleanupUserResources([proUser.user.id, freeUser.user.id]);

    // Verify persistent users still exist in the database for reuse
    const checkPro = await prisma.user.findUnique({ where: { id: proUser.user.id } });
    const checkFree = await prisma.user.findUnique({ where: { id: freeUser.user.id } });
    expect(checkPro).not.toBeNull();
    expect(checkFree).not.toBeNull();
  });

  // =========================================================================
  // SCENARIO 1: Multi-Tenant Workspace Creation & Tier Quotas
  // =========================================================================
  describe("Scenario 1: Workspace Management & Subscription Plan Isolation", () => {
    it("should allow Pro user to create a high-capacity workspace", async () => {
      proWorkspace = await createTestWorkspace(proUser.user, "Pro Production Cloud");
      expect(proWorkspace.id).toBeDefined();
      expect(proWorkspace.createdBy).toBe(proUser.user.id);

      const dbWs = await prisma.workspace.findUnique({ where: { id: proWorkspace.id } });
      expect(dbWs?.name).toBe("Pro Production Cloud");
    });

    it("should allow Free user to create a standard workspace", async () => {
      freeWorkspace = await createTestWorkspace(freeUser.user, "Free Starter Workspace");
      expect(freeWorkspace.id).toBeDefined();
      expect(freeWorkspace.createdBy).toBe(freeUser.user.id);

      const dbWs = await prisma.workspace.findUnique({ where: { id: freeWorkspace.id } });
      expect(dbWs?.name).toBe("Free Starter Workspace");
    });
  });

  // =========================================================================
  // SCENARIO 2: Project Management, Tier Constraints & Security Configuration
  // =========================================================================
  describe("Scenario 2: Project Lifecycle, Tier Limits & IP Whitelisting", () => {
    it("should allow Pro user to create a project with multiple environments", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/project",
        token: proUser.token,
        body: {
          name: "Pro Core API Gateway",
          description: "Production gateway service",
          workspaceId: proWorkspace.id,
        },
      });

      const res = await createProject(req, {});
      expect(res.status).toBe(201);

      proProject = await res.json();
      expect(proProject.name).toBe("Pro Core API Gateway");
      expect(proProject.workspaceId).toBe(proWorkspace.id);
    });

    it("should allow Free user to create projects up to free tier limit (3 projects)", async () => {
      // Create Project 1 (Free)
      const p1Req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/project",
        token: freeUser.token,
        body: { name: "Free Microservice Alpha", description: "Project 1", workspaceId: freeWorkspace.id },
      });
      const p1Res = await createProject(p1Req, {});
      expect(p1Res.status).toBe(201);
      freeProject = await p1Res.json();

      // Create Project 2 (Free)
      const p2Req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/project",
        token: freeUser.token,
        body: { name: "Free Microservice Beta", description: "Project 2", workspaceId: freeWorkspace.id },
      });
      const p2Res = await createProject(p2Req, {});
      expect(p2Res.status).toBe(201);

      // Create Project 3 (Free)
      const p3Req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/project",
        token: freeUser.token,
        body: { name: "Free Microservice Gamma", description: "Project 3", workspaceId: freeWorkspace.id },
      });
      const p3Res = await createProject(p3Req, {});
      expect(p3Res.status).toBe(201);

      // TIER ENFORCEMENT: Attempt 4th project in Free Workspace -> MUST be rejected with 403
      const p4Req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/project",
        token: freeUser.token,
        body: { name: "Free Microservice Delta", description: "Project 4 - Over limit", workspaceId: freeWorkspace.id },
      });
      const p4Res = await createProject(p4Req, {});
      expect(p4Res.status).toBe(403);

      const errData = await p4Res.json();
      expect(errData.error).toContain("Project limit reached");
    });

    it("should add and remove IP restrictions from Pro project", async () => {
      // 1. Add IP
      const addIpReq = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/project/${proProject.id}/ip`,
        token: proUser.token,
        body: {
          ip: "198.51.100.25",
          description: "Primary VPC Nat Gateway",
        },
      });
      const addRes = await addProjectIp(addIpReq, { params: Promise.resolve({ id: proProject.id }) });
      expect(addRes.status).toBe(200);

      // Verify in DB
      const updated = await prisma.project.findUnique({ where: { id: proProject.id } });
      const ipList = (updated?.ipRestrictions || []) as any[];
      expect(ipList.some((r) => r.ip === "198.51.100.25")).toBe(true);

      // 2. Remove IP
      const removeIpReq = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/project/${proProject.id}/ip`,
        token: proUser.token,
        body: { ip: "198.51.100.25" },
      });
      const removeRes = await removeProjectIp(removeIpReq, { params: Promise.resolve({ id: proProject.id }) });
      expect(removeRes.status).toBe(200);
    });

    it("should update project details via PUT /api/project", async () => {
      const updateReq = createMockRequest({
        method: "PUT",
        url: `http://localhost:3000/api/project?id=${proProject.id}`,
        token: proUser.token,
        searchParams: { id: proProject.id },
        body: {
          name: "Pro Core API Gateway - High Availability",
          description: "Updated mission-critical gateway",
        },
      });

      const updateRes = await updateProject(updateReq, {});
      expect(updateRes.status).toBe(200);

      const updated = await prisma.project.findUnique({ where: { id: proProject.id } });
      expect(updated?.name).toBe("Pro Core API Gateway - High Availability");
    });
  });

  // =========================================================================
  // SCENARIO 3: Branch Management & Cross-Tenant Branch Isolation
  // =========================================================================
  describe("Scenario 3: Branch Lifecycle & Cross-Tenant Security", () => {
    let proMainBranch: any;
    let proStagingBranch: any;
    let proFeatureBranch: any;

    it("should allow Pro user to create multiple branches", async () => {
      // 1. Create main
      proMainBranch = await createTestBranch(proUser.user, proProject.id, { name: "main" });
      // 2. Create staging
      proStagingBranch = await createTestBranch(proUser.user, proProject.id, { name: "staging" });
      // 3. Create feature via API
      const featReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/branch",
        token: proUser.token,
        body: {
          name: "feature/oauth-v2",
          description: "OAuth2 implementation",
          projectId: proProject.id,
          versionNo: "1",
        },
      });
      const featRes = await handleBranchPost(featReq);
      expect(featRes.status).toBe(201);
      proFeatureBranch = await featRes.json();
      expect(proFeatureBranch.name).toBe("feature/oauth-v2");
    });

    it("SECURITY: Free user cannot list or access Pro project branches", async () => {
      const illicitGetReq = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/branch?projectId=${proProject.id}`,
        token: freeUser.token,
        searchParams: { projectId: proProject.id },
      });

      const illicitRes = await getBranches(illicitGetReq);
      expect(illicitRes.status).toBe(403);

      const errData = await illicitRes.json();
      expect(errData.error).toContain("Forbidden");
    });

    it("SECURITY: Free user cannot create a branch under Pro project", async () => {
      const illicitCreateReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/branch",
        token: freeUser.token,
        body: {
          name: "illicit-branch",
          projectId: proProject.id,
        },
      });

      const illicitRes = await handleBranchPost(illicitCreateReq);
      expect(illicitRes.status).toBe(403);
    });

    it("should clear branch secrets and delete an ephemeral branch", async () => {
      const ephemeralBranch = await createTestBranch(proUser.user, proProject.id, { name: "temp-clear-branch" });

      // 1. Clear branch
      const clearReq = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/branch?operation=clear&branchId=${ephemeralBranch.id}`,
        token: proUser.token,
        searchParams: { operation: "clear", branchId: ephemeralBranch.id },
      });
      const clearRes = await handleBranchPost(clearReq);
      expect(clearRes.status).toBe(200);

      // 2. Delete branch
      const deleteReq = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/branch?id=${ephemeralBranch.id}`,
        token: proUser.token,
        searchParams: { id: ephemeralBranch.id },
      });
      const deleteRes = await deleteBranch(deleteReq);
      expect(deleteRes.status).toBe(200);

      const checkDb = await prisma.branch.findUnique({ where: { id: ephemeralBranch.id } });
      expect(checkDb).toBeNull();
    });
  });

  // =========================================================================
  // SCENARIO 4: Cryptographic Secret Operations & State Machine
  // =========================================================================
  describe("Scenario 4: Cryptographic Secret Lifecycle (AES-256-GCM, Decryption, Versioning, Rollback & Copy)", () => {
    let createdSecret: any;
    const rawPlaintext = "prod_sk_live_99887766554433221100";

    it("should create secret with AES-256-GCM encryption and masked HTTP response", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: proUser.token,
        body: {
          key: "PAYMENT_GATEWAY_SECRET",
          value: rawPlaintext,
          description: "Stripe Production Secret",
          environmentType: "production",
          projectId: proProject.id,
          type: "string",
        },
      });

      const res = await createSecret(req, {});
      expect(res.status).toBe(201);

      createdSecret = await res.json();
      expect(createdSecret.key).toBe("PAYMENT_GATEWAY_SECRET");
      expect(createdSecret.value).toBe("[encrypted]");
      expect(createdSecret.id).toBeDefined();

      // Verify DB level encryption
      const dbSecret = await prisma.secret.findUnique({ where: { id: createdSecret.id } });
      expect(dbSecret).not.toBeNull();
      expect(dbSecret?.value[0]).not.toBe(rawPlaintext);

      const parsedPayload = JSON.parse(dbSecret?.value[0] || "{}");
      expect(parsedPayload.iv).toBeDefined();
      expect(parsedPayload.encryptedData).toBeDefined();
      expect(parsedPayload.authTag).toBeDefined();

      // Authenticated Decryption Verification
      const decrypted = decrypt(parsedPayload);
      expect(decrypted).toBe(rawPlaintext);
    });

    it("should fetch and decrypt secrets in real-time for authorized Pro user", async () => {
      const getReq = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${proProject.id}`,
        token: proUser.token,
        searchParams: { projectId: proProject.id },
      });

      const getRes = await getSecrets(getReq, {});
      expect(getRes.status).toBe(200);

      const secrets = await getRes.json();
      const target = secrets.find((s: any) => s.id === createdSecret.id);
      expect(target).toBeDefined();
      expect(target.value).toBe(rawPlaintext);
    });

    it("should import bulk secrets and ensure history entries are encrypted", async () => {
      const bulkReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/bulk",
        token: proUser.token,
        body: {
          projectId: proProject.id,
          environmentType: "staging",
          secrets: [
            { key: "REDIS_HOST", value: "redis-cluster.internal" },
            { key: "REDIS_PORT", value: "6379" },
          ],
        },
      });

      const bulkRes = await bulkCreateSecrets(bulkReq, {});
      expect(bulkRes.status).toBe(201);

      const bulkData = await bulkRes.json();
      expect(bulkData.count).toBe(2);

      // Verify DB history is encrypted
      const dbSecrets = await prisma.secret.findMany({
        where: { projectId: proProject.id, key: { in: ["REDIS_HOST", "REDIS_PORT"] } },
      });
      expect(dbSecrets.length).toBe(2);

      for (const sec of dbSecrets) {
        const history = sec.history as any[];
        expect(Array.isArray(history)).toBe(true);
        expect(history[0].value).not.toBe("redis-cluster.internal");
        expect(history[0].value).not.toBe("6379");
      }
    });

    it("should update secret with version bump (v1 -> v2) and masked response", async () => {
      const updateReq = createMockRequest({
        method: "PUT",
        url: `http://localhost:3000/api/secret?id=${createdSecret.id}`,
        token: proUser.token,
        searchParams: { id: createdSecret.id },
        body: {
          id: createdSecret.id,
          value: "prod_sk_live_ROTATED_v2_key",
          description: "Rotated stripe secret",
        },
      });

      const updateRes = await updateSecret(updateReq, {});
      expect(updateRes.status).toBe(200);

      const updateData = await updateRes.json();
      expect(updateData.version).toBe("2");
      expect(updateData.value).toBe("[encrypted]");

      // Verify DB version is "2" and history contains v1
      const updatedDb = await prisma.secret.findUnique({ where: { id: createdSecret.id } });
      expect(updatedDb?.version).toBe("2");
      const history = updatedDb?.history as any[];
      expect(history.length).toBeGreaterThanOrEqual(1);
    });

    it("should rollback secret to v1 and verify plaintext value is restored", async () => {
      const rollbackReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/rollback",
        token: proUser.token,
        body: {
          secretId: createdSecret.id,
          targetVersion: "1",
          changeReason: "Emergency rollback to original operational secret",
        },
      });

      const rollbackRes = await rollbackSecret(rollbackReq);
      expect(rollbackRes.status).toBe(200);

      const rollbackData = await rollbackRes.json();
      expect(rollbackData.success).toBe(true);

      // Verify decrypted value fetched via GET is restored to original plaintext
      const getReq = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${proProject.id}`,
        token: proUser.token,
        searchParams: { projectId: proProject.id },
      });

      const getRes = await getSecrets(getReq, {});
      const secrets = await getRes.json();
      const target = secrets.find((s: any) => s.id === createdSecret.id);
      expect(target.value).toBe(rawPlaintext);
    });

    it("should copy secrets between branches and reject unauthorized cross-tenant copy", async () => {
      const sourceBranch = await createTestBranch(proUser.user, proProject.id, { name: "release-v2.0" });
      const targetBranch = await createTestBranch(proUser.user, proProject.id, { name: "release-v2.1" });

      // Create secret on source branch
      const createReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: proUser.token,
        body: {
          key: "JWT_SIGNING_KEY",
          value: "jwt_secret_token_alpha",
          projectId: proProject.id,
          branchId: sourceBranch.id,
          environmentType: "development",
          type: "string",
        },
      });
      await createSecret(createReq, {});

      // 1. Authorized Pro User branch copy
      const copyReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/copy",
        token: proUser.token,
        body: {
          sourceBranchId: sourceBranch.id,
          targetBranchId: targetBranch.id,
        },
      });
      const copyRes = await copySecrets(copyReq, {});
      expect(copyRes.status).toBe(200);

      const targetSecrets = await prisma.secret.findMany({ where: { branchId: targetBranch.id } });
      expect(targetSecrets.length).toBe(1);
      expect(targetSecrets[0].key).toBe("JWT_SIGNING_KEY");

      // 2. SECURITY: Free User attempts to copy secret from Pro branch to Free branch
      const freeBranch = await createTestBranch(freeUser.user, freeProject.id, { name: "free-main" });

      const illicitCopyReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/copy",
        token: freeUser.token,
        body: {
          sourceBranchId: sourceBranch.id, // Victim branch (Pro)
          targetBranchId: freeBranch.id,
        },
      });
      const illicitRes = await copySecrets(illicitCopyReq, {});
      expect(illicitRes.status).toBe(403);
    });

    it("should delete a secret", async () => {
      const createReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: proUser.token,
        body: {
          key: "TEMPORARY_TEST_KEY",
          value: "temporary_value",
          projectId: proProject.id,
          environmentType: "development",
          type: "string",
        },
      });
      const createRes = await createSecret(createReq, {});
      const tempSec = await createRes.json();

      const deleteReq = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/secret?id=${tempSec.id}`,
        token: proUser.token,
        searchParams: { id: tempSec.id },
      });
      const deleteRes = await deleteSecret(deleteReq, {});
      expect(deleteRes.status).toBe(200);

      const checkDb = await prisma.secret.findUnique({ where: { id: tempSec.id } });
      expect(checkDb).toBeNull();
    });
  });

  // =========================================================================
  // SCENARIO 5: Multi-Tenant Isolation, RBAC, Viewer Redaction & JIT Access
  // =========================================================================
  describe("Scenario 5: Multi-Tenant Isolation, RBAC Redaction & Just-In-Time (JIT) Elevation", () => {
    let sensitiveSecret: any;
    const sensitivePlaintext = "root_mysql_super_admin_pass_9988";

    beforeAll(async () => {
      // Pro User creates a sensitive secret
      const createReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: proUser.token,
        body: {
          key: "CONFIDENTIAL_DB_MASTER_KEY",
          value: sensitivePlaintext,
          description: "Database root password",
          projectId: proProject.id,
          environmentType: "production",
          type: "string",
        },
      });
      const createRes = await createSecret(createReq, {});
      sensitiveSecret = await createRes.json();
    });

    it("SECURITY: Free User (unauthorized tenant) CANNOT read or delete Pro secrets", async () => {
      // 1. Illicit Read
      const illicitGetReq = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${proProject.id}`,
        token: freeUser.token,
        searchParams: { projectId: proProject.id },
      });
      const illicitGetRes = await getSecrets(illicitGetReq, {});
      expect(illicitGetRes.status).toBe(403);

      // 2. Illicit Delete
      const illicitDeleteReq = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/secret?id=${sensitiveSecret.id}`,
        token: freeUser.token,
        searchParams: { id: sensitiveSecret.id },
      });
      const illicitDeleteRes = await deleteSecret(illicitDeleteReq, {});
      expect(illicitDeleteRes.status).toBe(403);
    });

    it("should enforce Viewer role redaction ([REDACTED]) and block mutations when Free user is added as Viewer", async () => {
      // Pro User creates a team and associates it with proProject
      const team = await createTestTeam(proUser.user, proWorkspace.id, { name: "External Audit Team" });
      await prisma.teamProject.create({
        data: { teamId: team.id, projectId: proProject.id },
      });

      // Free user added to team with 'viewer' role
      await prisma.teamUser.create({
        data: { teamId: team.id, userId: freeUser.user.id, role: "viewer", status: "active" },
      });

      await invalidateUserRbacCache(freeUser.user.id);

      // 1. Viewer attempts secret creation -> MUST be blocked
      const viewerCreateReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: freeUser.token,
        body: {
          key: "VIEWER_FORBIDDEN_KEY",
          value: "val",
          projectId: proProject.id,
          environmentType: "production",
          type: "string",
        },
      });
      const viewerCreateRes = await createSecret(viewerCreateReq, {});
      expect(viewerCreateRes.status).toBe(403);

      // 2. Viewer reads secrets -> value MUST be masked as [REDACTED]
      const viewerGetReq = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${proProject.id}`,
        token: freeUser.token,
        searchParams: { projectId: proProject.id },
      });
      const viewerGetRes = await getSecrets(viewerGetReq, {});
      expect(viewerGetRes.status).toBe(200);

      const secrets = await viewerGetRes.json();
      const target = secrets.find((s: any) => s.id === sensitiveSecret.id);
      expect(target).toBeDefined();
      expect(target.value).toBe("[REDACTED]");
    });

    it("should elevate Viewer access to decrypted value on JIT approval and re-mask on JIT revocation", async () => {
      // 1. Create Approved JIT Access Request for this specific secret
      const jitRequest = await prisma.accessRequest.create({
        data: {
          userId: freeUser.user.id,
          projectId: proProject.id,
          secretIds: [sensitiveSecret.id],
          status: "approved",
          duration: 60,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour valid
          reason: "Incident investigation INC-5544",
        },
      });

      await invalidateUserRbacCache(freeUser.user.id);

      // 2. Viewer fetches secrets with active JIT -> receives decrypted plaintext!
      const jitGetReq = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${proProject.id}`,
        token: freeUser.token,
        searchParams: { projectId: proProject.id },
      });
      const jitGetRes = await getSecrets(jitGetReq, {});
      expect(jitGetRes.status).toBe(200);

      const jitData = await jitGetRes.json();
      const target = jitData.find((s: any) => s.id === sensitiveSecret.id);
      expect(target.value).toBe(sensitivePlaintext);

      // 3. Revoke JIT Access
      await prisma.accessRequest.update({
        where: { id: jitRequest.id },
        data: { status: "revoked" },
      });

      await invalidateUserRbacCache(freeUser.user.id);

      // 4. Viewer fetches again -> secret value MUST be safely re-redacted to [REDACTED]
      const postRevokeGetReq = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${proProject.id}`,
        token: freeUser.token,
        searchParams: { projectId: proProject.id },
      });
      const postRevokeRes = await getSecrets(postRevokeGetReq, {});
      const postRevokeData = await postRevokeRes.json();
      const postRevokeTarget = postRevokeData.find((s: any) => s.id === sensitiveSecret.id);
      expect(postRevokeTarget.value).toBe("[REDACTED]");
    });
  });

  // =========================================================================
  // SCENARIO 6: Audit Trails, Dashboard Metrics & SOC 2 Compliance
  // =========================================================================
  describe("Scenario 6: Audit Logging, Security Dashboard & SOC 2 Reporting", () => {
    it("should retrieve audit logs with zero credential leakage (no password/TOTP leaks)", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/audit?workspaceId=${proWorkspace.id}`,
        token: proUser.token,
        searchParams: { workspaceId: proWorkspace.id },
      });

      const res = await getAuditLogs(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);

      for (const log of data.data) {
        if (log.user) {
          expect(log.user.password).toBeUndefined();
          expect(log.user.mfaSecret).toBeUndefined();
          expect(log.user.mfaBackupCodes).toBeUndefined();
          expect(log.user.emailOtp).toBeUndefined();
        }
      }
    });

    it("should retrieve audit dashboard metrics and anomaly summaries", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/audit/dashboard?workspaceId=${proWorkspace.id}`,
        token: proUser.token,
        searchParams: { workspaceId: proWorkspace.id },
      });

      const res = await getAuditDashboard(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.stats).toBeDefined();
      expect(typeof data.stats.totalEvents).toBe("number");
      expect(data.anomalies).toBeDefined();
      expect(Array.isArray(data.anomalies)).toBe(true);
    });

    it("should generate a SOC 2 & compliance health report", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/compliance/report?workspaceId=${proWorkspace.id}`,
        token: proUser.token,
        searchParams: { workspaceId: proWorkspace.id },
      });

      const res = await getComplianceReport(req);
      expect(res.status).toBe(200);

      const report = await res.json();
      expect(report.generatedAt).toBeDefined();
      expect(report.generatedBy).toBe(proUser.user.email);
      expect(report.summary).toBeDefined();
      expect(typeof report.summary.totalProjects).toBe("number");
      expect(typeof report.summary.totalSecrets).toBe("number");
      expect(typeof report.summary.totalAuditEntries).toBe("number");
    });
  });
});
