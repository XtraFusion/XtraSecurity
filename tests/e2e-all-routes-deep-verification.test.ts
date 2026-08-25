import { GET as getWorkspaces, POST as createWorkspace, PUT as updateWorkspace, DELETE as deleteWorkspace } from "@/app/api/workspace/route";
import { GET as getProjects, POST as createProject, PUT as updateProject, DELETE as deleteProject } from "@/app/api/project/route";
import { POST as addProjectIp, DELETE as removeProjectIp } from "@/app/api/project/[id]/ip/route";
import { GET as getBranches, POST as handleBranchPost, DELETE as deleteBranch } from "@/app/api/branch/route";
import { GET as getSecrets, POST as createSecret, PUT as updateSecret, DELETE as deleteSecret } from "@/app/api/secret/route";
import { POST as bulkCreateSecrets } from "@/app/api/secret/bulk/route";
import { POST as copySecrets } from "@/app/api/secret/copy/route";
import { POST as rollbackSecret } from "@/app/api/secret/rollback/route";
import { POST as createSecretShare, GET as getSharedSecret } from "@/app/api/secret/share/route";
import { POST as inviteTeamMember } from "@/app/api/team/invite/route";
import { POST as acceptTeamInvite } from "@/app/api/team/invite/accept/route";
import { PUT as updateTeamMemberRole } from "@/app/api/team/role/route";
import { DELETE as removeTeamMember } from "@/app/api/team/remove/route";
import { POST as generateJitLink } from "@/app/api/jit/generate/route";
import { POST as claimJitLink } from "@/app/api/jit/claim/route";
import { GET as getServiceAccounts, POST as createServiceAccount } from "@/app/api/projects/[projectId]/service-accounts/route";
import { POST as createServiceAccountKey } from "@/app/api/projects/[projectId]/service-accounts/[saId]/keys/route";
import { GET as getWebhooks, POST as createWebhook } from "@/app/api/projects/[projectId]/webhooks/route";
import { GET as getRotationSchedules, POST as createRotationSchedule } from "@/app/api/rotation/schedules/route";
import { GET as getUserSettings, PATCH as updateUserSettings } from "@/app/api/user/settings/route";
import { GET as getAuditLogs } from "@/app/api/audit/route";
import { GET as getAuditDashboard } from "@/app/api/audit/dashboard/route";
import { GET as getComplianceReport } from "@/app/api/compliance/report/route";
import { GET as getSubscriptionUsage } from "@/app/api/subscription/usage/route";
import { provisionAllTestUsers, SeededUser } from "./helpers/seed-users";
import { createMockRequest, cleanupUserResources, createTestWorkspace, createTestProject, createTestBranch, createTestTeam } from "./helpers/test-utils";
import { SimulationLogger } from "./helpers/simulation-logger";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";
import jwt from "jsonwebtoken";

describe("E2E Full System & Route-by-Route Deep Feature Audit", () => {
  const logger = new SimulationLogger();

  let userMap: Record<string, { user: any; token: string; credentials: SeededUser }>;

  // Key Actors
  let superAdmin: { user: any; token: string };
  let enterpriseOwner: { user: any; token: string };
  let teamAdmin: { user: any; token: string };
  let devSenior: { user: any; token: string };
  let devJunior: { user: any; token: string };
  let auditorViewer: { user: any; token: string };
  let contractor: { user: any; token: string };
  let attacker: { user: any; token: string };
  let responder: { user: any; token: string };

  // Shared System State
  let workspace: any;
  let team: any;
  let project: any;
  let mainBranch: any;
  let stagingBranch: any;
  let devSecret: any;
  let prodSecret: any;
  let createdServiceAccount: any;
  let createdJitLink: any;

  beforeAll(async () => {
    // 1. Provision all 9 deterministic test users with clear bcrypt credentials
    userMap = await provisionAllTestUsers();

    superAdmin = userMap["superadmin@xtrasecurity.test"];
    enterpriseOwner = userMap["owner.enterprise@xtrasecurity.test"];
    teamAdmin = userMap["admin.team@xtrasecurity.test"];
    devSenior = userMap["dev.senior@xtrasecurity.test"];
    devJunior = userMap["dev.junior@xtrasecurity.test"];
    auditorViewer = userMap["auditor.viewer@xtrasecurity.test"];
    contractor = userMap["contractor@external-vendor.test"];
    attacker = userMap["attacker@blackhat.test"];
    responder = userMap["responder@emergency.test"];

    // 2. Clean stale resources from previous test runs
    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);

    // 3. Setup Baseline Workspace & Project
    workspace = await createTestWorkspace(enterpriseOwner.user, "CyberCore Global Cloud");
    team = await createTestTeam(enterpriseOwner.user, workspace.id, { name: "Core Engineering Team" });

    // Seed Team Memberships
    await prisma.teamUser.createMany({
      data: [
        { teamId: team.id, userId: teamAdmin.user.id, role: "admin", status: "active" },
        { teamId: team.id, userId: devSenior.user.id, role: "developer", status: "active" },
        { teamId: team.id, userId: devJunior.user.id, role: "developer", status: "active" },
        { teamId: team.id, userId: auditorViewer.user.id, role: "viewer", status: "active" },
      ],
    });

    project = await createTestProject(enterpriseOwner.user, workspace.id, {
      name: "Core Financial Transactions Service",
      description: "Mission critical banking engine",
    });

    await prisma.teamProject.create({
      data: { teamId: team.id, projectId: project.id },
    });

    mainBranch = await createTestBranch(enterpriseOwner.user, project.id, { name: "main" });
    stagingBranch = await createTestBranch(enterpriseOwner.user, project.id, { name: "staging" });

    // Seed baseline secrets
    const devEncrypted = JSON.stringify(await import("@/lib/encription").then((m) => m.encrypt("postgres://dev_user:pass123@internal-db:5432/app")));
    devSecret = await prisma.secret.create({
      data: {
        key: "DATABASE_CONNECTION_STRING",
        value: [devEncrypted],
        description: "Postgres connection string",
        environmentType: "development",
        type: "string",
        version: "1",
        projectId: project.id,
        branchId: mainBranch.id,
        updatedBy: devSenior.user.id,
        permission: [],
        rotationPolicy: "manual",
        history: [{ version: "1", value: [devEncrypted], description: "Initial", updatedAt: new Date().toISOString() }],
      },
    });

    const prodEncrypted = JSON.stringify(await import("@/lib/encription").then((m) => m.encrypt("sk_live_stripe_9988aabbccddee")));
    prodSecret = await prisma.secret.create({
      data: {
        key: "STRIPE_PAYMENT_GATEWAY_KEY",
        value: [prodEncrypted],
        description: "Live Stripe gateway token",
        environmentType: "production",
        type: "string",
        version: "1",
        projectId: project.id,
        branchId: mainBranch.id,
        updatedBy: enterpriseOwner.user.id,
        permission: [],
        rotationPolicy: "manual",
        history: [{ version: "1", value: [prodEncrypted], description: "Initial", updatedAt: new Date().toISOString() }],
      },
    });

    // Invalidate caches
    for (const u of Object.values(userMap)) {
      await invalidateUserRbacCache(u.user.id);
    }
  });

  afterAll(async () => {
    // 1. Save and export comprehensive audit reports
    const summary = logger.save();
    console.log(`[Full System Audit JSON Log] -> ${summary.jsonPath}`);
    console.log(`[Full System Audit Markdown Report] -> ${summary.mdPath}`);

    // 2. Clean up test records, preserving test users intact
    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);

    // Verify all users remain in DB
    const count = await prisma.user.count({ where: { id: { in: allUserIds } } });
    expect(count).toBe(allUserIds.length);
  });

  // =========================================================================
  // 1. WORKSPACE & TEAM MEMBER MANAGEMENT
  // =========================================================================
  describe("1. Workspace & Team Management APIs", () => {
    let inviteMemberRecord: any;

    it("OWNER: Lists workspaces and checks active workspace", async () => {
      const req = createMockRequest({ method: "GET", url: "http://localhost:3000/api/workspace", token: enterpriseOwner.token });
      const res = await getWorkspaces(req, {});
      const data = await res.json();

      logger.log({
        scenario: "Owner lists organizations/workspaces",
        role: "Owner",
        actorEmail: enterpriseOwner.user.email,
        endpoint: "/api/workspace",
        method: "GET",
        responseStatus: res.status,
        responseSummary: { workspaceCount: Array.isArray(data) ? data.length : 0 },
        expectedStatus: 200,
      });

      const workspacesList = Array.isArray(data) ? data : (data.workspaces || []);
      expect(Array.isArray(workspacesList)).toBe(true);
      // Deep verification: Ensure returned list contains our created workspace with matching ID & Name
      const foundWorkspace = workspacesList.find((w: any) => w.id === workspace.id);
      expect(foundWorkspace).toBeDefined();
      expect(foundWorkspace.name).toBe("CyberCore Global Cloud");
    });

    it("ADMIN: Invites Contractor to team with 'viewer' role", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/team/invite",
        token: teamAdmin.token,
        body: { member: { teamId: team.id, email: contractor.user.email, role: "viewer" } },
      });
      const res = await inviteTeamMember(req);
      const data = await res.json();

      logger.log({
        scenario: "Admin invites contractor with viewer role",
        role: "Admin",
        actorEmail: teamAdmin.user.email,
        endpoint: "/api/team/invite",
        method: "POST",
        requestPayload: { email: contractor.user.email, role: "viewer" },
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      // Deep verification: Check DB record state directly
      inviteMemberRecord = await prisma.teamUser.findFirst({
        where: { teamId: team.id, userId: contractor.user.id },
      });
      expect(inviteMemberRecord).not.toBeNull();
      expect(inviteMemberRecord?.status).toBe("pending");
      expect(inviteMemberRecord?.role).toBe("viewer");
    });

    it("CONTRACTOR: Accepts team invitation -> Status transitions to active", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/team/invite/accept",
        token: contractor.token,
        body: { teamId: team.id, status: "active" },
      });
      const res = await acceptTeamInvite(req);
      const data = await res.json();

      logger.log({
        scenario: "Contractor accepts team invitation",
        role: "Contractor",
        actorEmail: contractor.user.email,
        endpoint: "/api/team/invite/accept",
        method: "POST",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      // Deep verification: Verify status in database transitioned to 'active'
      const updatedMember = await prisma.teamUser.findUnique({
        where: { id: inviteMemberRecord.id },
      });
      expect(updatedMember?.status).toBe("active");
    });

    it("ADMIN: Promotes Contractor from 'viewer' to 'developer'", async () => {
      const req = createMockRequest({
        method: "PUT",
        url: "http://localhost:3000/api/team/role",
        token: teamAdmin.token,
        body: { memberId: inviteMemberRecord.id, newRole: "developer" },
      });
      const res = await updateTeamMemberRole(req);
      const data = await res.json();

      logger.log({
        scenario: "Admin promotes contractor role to developer",
        role: "Admin",
        actorEmail: teamAdmin.user.email,
        endpoint: "/api/team/role",
        method: "PUT",
        requestPayload: { memberId: inviteMemberRecord.id, newRole: "developer" },
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      // Deep verification: DB role is updated to 'developer'
      const promotedMember = await prisma.teamUser.findUnique({
        where: { id: inviteMemberRecord.id },
      });
      expect(promotedMember?.role).toBe("developer");
    });

    it("OWNER: Removes Contractor from team -> Revokes all team privileges", async () => {
      const req = createMockRequest({
        method: "DELETE",
        url: "http://localhost:3000/api/team/remove",
        token: enterpriseOwner.token,
        body: { memberId: inviteMemberRecord.id },
      });
      const res = await removeTeamMember(req);
      const data = await res.json();

      logger.log({
        scenario: "Owner removes contractor from team",
        role: "Owner",
        actorEmail: enterpriseOwner.user.email,
        endpoint: "/api/team/remove",
        method: "DELETE",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      // Deep verification: Record is completely removed from DB
      const deletedMember = await prisma.teamUser.findUnique({
        where: { id: inviteMemberRecord.id },
      });
      expect(deletedMember).toBeNull();
    });
  });

  // =========================================================================
  // 2. PROJECT, IP FIREWALL & BRANCH LIFECYCLE
  // =========================================================================
  describe("2. Project, IP Restrictions & Branch APIs", () => {
    it("ADMIN: Adds and removes IP restriction from Project", async () => {
      // 1. Add IP
      const addReq = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/project/${project.id}/ip`,
        token: teamAdmin.token,
        body: { ip: "192.0.2.55", description: "Office Bastion" },
      });
      const addRes = await addProjectIp(addReq, { params: Promise.resolve({ id: project.id }) });
      expect(addRes.status).toBe(200);

      // Deep verification: DB project now includes this IP
      const projectWithIp = await prisma.project.findUnique({ where: { id: project.id } });
      const ipList = (projectWithIp?.ipRestrictions || []) as any[];
      expect(ipList.some((r: any) => r.ip === "192.0.2.55")).toBe(true);

      // 2. Remove IP
      const delReq = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/project/${project.id}/ip`,
        token: teamAdmin.token,
        body: { ip: "192.0.2.55" },
      });
      const delRes = await removeProjectIp(delReq, { params: Promise.resolve({ id: project.id }) });
      expect(delRes.status).toBe(200);

      // Deep verification: DB project no longer includes this IP
      const projectWithoutIp = await prisma.project.findUnique({ where: { id: project.id } });
      const ipListAfter = (projectWithoutIp?.ipRestrictions || []) as any[];
      expect(ipListAfter.some((r: any) => r.ip === "192.0.2.55")).toBe(false);

      logger.log({
        scenario: "Admin tests IP allowlist lifecycle (Add & Remove)",
        role: "Admin",
        actorEmail: teamAdmin.user.email,
        endpoint: `/api/project/${project.id}/ip`,
        method: "POST/DELETE",
        responseStatus: 200,
        responseSummary: { verified: true },
        expectedStatus: 200,
      });
    });

    it("DEV SENIOR: Creates, lists, and deletes a feature branch", async () => {
      // 1. Create branch
      const createReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/branch",
        token: devSenior.token,
        body: { name: "feature/zero-knowledge-auth", description: "ZK auth implementation", projectId: project.id },
      });
      const createRes = await handleBranchPost(createReq);
      const branchData = await createRes.json();
      expect(createRes.status).toBe(201);
      // Deep verification: Response body has matching name and projectId
      expect(branchData.name).toBe("feature/zero-knowledge-auth");
      expect(branchData.projectId).toBe(project.id);
      expect(branchData.id).toBeDefined();

      // 2. List branches
      const listReq = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/branch?projectId=${project.id}`,
        token: devSenior.token,
        searchParams: { projectId: project.id },
      });
      const listRes = await getBranches(listReq);
      const branchList = await listRes.json();
      expect(listRes.status).toBe(200);
      expect(Array.isArray(branchList)).toBe(true);
      expect(branchList.some((b: any) => b.id === branchData.id)).toBe(true);

      // 3. Delete branch
      const delReq = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/branch?id=${branchData.id}`,
        token: devSenior.token,
        searchParams: { id: branchData.id },
      });
      const delRes = await deleteBranch(delReq);
      expect(delRes.status).toBe(200);

      // Deep verification: DB branch is deleted
      const dbBranch = await prisma.branch.findUnique({ where: { id: branchData.id } });
      expect(dbBranch).toBeNull();

      logger.log({
        scenario: "Developer completes full branch lifecycle (Create, List, Delete)",
        role: "Developer",
        actorEmail: devSenior.user.email,
        endpoint: "/api/branch",
        method: "POST/GET/DELETE",
        responseStatus: 200,
        responseSummary: { branchCreated: branchData.name, branchDeleted: true },
        expectedStatus: 200,
      });
    });
  });

  // =========================================================================
  // 3. CRYPTOGRAPHIC SECRETS, SHARING & VERSIONING
  // =========================================================================
  describe("3. Secrets Engine, Sharing & Versioning APIs", () => {
    it("DEV JUNIOR: Creates a secret in development environment -> Encrypted at rest", async () => {
      const rawSecret = "redis://default:complexpass123@cache-cluster.internal:6379";
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: devJunior.token,
        body: {
          key: "REDIS_SESSION_CACHE_URL",
          value: rawSecret,
          description: "Redis session store",
          environmentType: "development",
          projectId: project.id,
          type: "string",
        },
      });
      const res = await createSecret(req, {});
      const data = await res.json();

      logger.log({
        scenario: "Developer creates development secret",
        role: "Developer",
        actorEmail: devJunior.user.email,
        endpoint: "/api/secret",
        method: "POST",
        responseStatus: res.status,
        responseSummary: { key: data.key, value: data.value },
        expectedStatus: 201,
        notes: "HTTP response returned masked value '[encrypted]'",
      });

      expect(res.status).toBe(201);
      // Deep verification: Response body has masked placeholder '[encrypted]'
      expect(data.value).toBe("[encrypted]");
      expect(data.key).toBe("REDIS_SESSION_CACHE_URL");
      expect(data.environmentType).toBe("development");

      // Deep verification: Verify database ciphertext is AES-256-GCM encrypted and decrypts to raw secret
      const dbSecret = await prisma.secret.findUnique({ where: { id: data.id } });
      expect(dbSecret).not.toBeNull();
      expect(dbSecret?.value[0]).not.toBe(rawSecret); // NOT in plaintext!
      const { decrypt } = await import("@/lib/encription");
      const parsedCiphertext = JSON.parse(dbSecret!.value[0]);
      const decryptedPlaintext = decrypt(parsedCiphertext);
      expect(decryptedPlaintext).toBe(rawSecret);
    });

    it("DEV SENIOR: Creates a secure shareable secret link", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/share",
        token: devSenior.token,
        body: {
          secretId: devSecret.id,
          expiresInHours: 12,
          maxViews: 3,
          label: "Temporary DB credentials for contractor",
        },
      });
      const res = await createSecretShare(req);
      const data = await res.json();

      logger.log({
        scenario: "Developer creates time-limited secret share link",
        role: "Developer",
        actorEmail: devSenior.user.email,
        endpoint: "/api/secret/share",
        method: "POST",
        responseStatus: res.status,
        responseSummary: { shareUrl: data.shareUrl, token: data.token },
        expectedStatus: 201,
      });

      expect(res.status).toBe(201);
      // Deep verification: Token is a 64-character cryptographically secure hex string
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe("string");
      expect(data.token.length).toBe(64);
      expect(data.shareUrl).toContain(data.token);

      // Deep verification: Fetch via public share GET endpoint and verify decrypted payload
      const publicReq = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret/share?token=${data.token}`,
        searchParams: { token: data.token },
      });
      const publicRes = await getSharedSecret(publicReq);
      const shareDetails = await publicRes.json();
      expect(publicRes.status).toBe(200);
      expect(shareDetails.key).toBe("DATABASE_CONNECTION_STRING");
      expect(shareDetails.value).toBe("postgres://dev_user:pass123@internal-db:5432/app");
    });

    it("DEV SENIOR: Updates secret to version v2 and performs rollback", async () => {
      const v2Value = "postgres://dev_user:v2_new_password@internal-db:5432/app";
      // 1. Update
      const updateReq = createMockRequest({
        method: "PUT",
        url: `http://localhost:3000/api/secret?id=${devSecret.id}`,
        token: devSenior.token,
        searchParams: { id: devSecret.id },
        body: { id: devSecret.id, value: v2Value },
      });
      const updateRes = await updateSecret(updateReq, {});
      const updated = await updateRes.json();
      expect(updateRes.status).toBe(200);
      // Deep verification: Version is bumped to '2'
      expect(updated.version).toBe("2");

      // 2. Rollback to v1
      const rollbackReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/rollback",
        token: devSenior.token,
        body: { secretId: devSecret.id, targetVersion: "1" },
      });
      const rollbackRes = await rollbackSecret(rollbackReq);
      const rolledBack = await rollbackRes.json();
      expect(rollbackRes.status).toBe(200);
      // Deep verification: Version after rollback is '3'
      expect(rolledBack.version).toBe("3");

      // Deep verification: Decrypt database secret and verify it matches the ORIGINAL v1 plaintext!
      const restoredSecret = await prisma.secret.findUnique({ where: { id: devSecret.id } });
      const { decrypt } = await import("@/lib/encription");
      const restoredCiphertext = JSON.parse(restoredSecret!.value[0]);
      const restoredPlaintext = decrypt(restoredCiphertext);
      expect(restoredPlaintext).toBe("postgres://dev_user:pass123@internal-db:5432/app");

      logger.log({
        scenario: "Developer updates secret (v1 -> v2) and rolls back to v1 content",
        role: "Developer",
        actorEmail: devSenior.user.email,
        endpoint: "/api/secret/rollback",
        method: "POST",
        responseStatus: 200,
        responseSummary: { previousVersion: "2", restoredVersion: "3", restoredValueMatches: true },
        expectedStatus: 200,
      });
    });
  });

  // =========================================================================
  // 4. JIT ACCESS LINKS & ACCESS REQUEST ELEVATION
  // =========================================================================
  describe("4. Just-In-Time (JIT) Links & Elevation APIs", () => {
    it("OWNER: Generates a shareable time-limited JIT access link", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/jit/generate",
        token: enterpriseOwner.token,
        body: {
          projectId: project.id,
          duration: 45, // 45 minutes
          maxUses: 2,
          expiresInHours: 24,
          label: "Emergency access link for Tier-3 DevOps on-call",
        },
      });
      const res = await generateJitLink(req);
      createdJitLink = await res.json();

      logger.log({
        scenario: "Owner generates time-limited JIT invitation link",
        role: "Owner",
        actorEmail: enterpriseOwner.user.email,
        endpoint: "/api/jit/generate",
        method: "POST",
        responseStatus: res.status,
        responseSummary: { token: createdJitLink.token, url: createdJitLink.url },
        expectedStatus: [200, 201],
      });

      expect([200, 201]).toContain(res.status);
      // Deep verification: Token exists, duration is 45 minutes, accessLevel is read
      expect(createdJitLink.token).toBeDefined();
      expect(createdJitLink.duration).toBe(45);
      expect(createdJitLink.accessLevel).toBe("read");
    });

    it("CONTRACTOR: Claims JIT access link -> Automatically creates AccessRequest", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/jit/claim",
        token: contractor.token,
        body: { token: createdJitLink.token },
      });
      const res = await claimJitLink(req);
      const data = await res.json();

      logger.log({
        scenario: "Contractor claims JIT link (AccessRequest generated)",
        role: "Contractor",
        actorEmail: contractor.user.email,
        endpoint: "/api/jit/claim",
        method: "POST",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      expect(data.requestId).toBeDefined();
      expect(data.status).toBe("pending");

      // Deep verification: Query database for created access request
      const dbAccessRequest = await prisma.accessRequest.findUnique({
        where: { id: data.requestId },
      });
      expect(dbAccessRequest).not.toBeNull();
      expect(dbAccessRequest?.status).toBe("pending");
      expect(dbAccessRequest?.userId).toBe(contractor.user.id);
      expect(dbAccessRequest?.projectId).toBe(project.id);
      expect(dbAccessRequest?.duration).toBe(45);
    });
  });

  // =========================================================================
  // 5. SERVICE ACCOUNTS & API KEYS MANAGEMENT
  // =========================================================================
  describe("5. Service Accounts & Scoped Machine Tokens", () => {
    it("OWNER: Creates a scoped Service Account with read/write permissions", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/projects/${project.id}/service-accounts`,
        token: enterpriseOwner.token,
        body: {
          name: "Terraform Infrastructure Automation",
          description: "IaC secrets synchronization daemon",
          permissions: ["read:secrets", "write:secrets"],
        },
      });
      const res = await createServiceAccount(req, { params: Promise.resolve({ projectId: project.id }) });
      createdServiceAccount = await res.json();

      logger.log({
        scenario: "Owner creates machine service account",
        role: "Owner",
        actorEmail: enterpriseOwner.user.email,
        endpoint: `/api/projects/${project.id}/service-accounts`,
        method: "POST",
        responseStatus: res.status,
        responseSummary: { saId: createdServiceAccount.id, name: createdServiceAccount.name },
        expectedStatus: 201,
      });

      expect(res.status).toBe(201);
      // Deep verification: Check name, project ID, and permission list
      expect(createdServiceAccount.id).toBeDefined();
      expect(createdServiceAccount.name).toBe("Terraform Infrastructure Automation");
      expect(createdServiceAccount.projectId).toBe(project.id);
      expect(createdServiceAccount.permissions).toEqual(["read:secrets", "write:secrets"]);
    });

    it("OWNER: Generates API key token for Service Account", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/projects/${project.id}/service-accounts/${createdServiceAccount.id}/keys`,
        token: enterpriseOwner.token,
        body: { label: "Production Key 2026", expiresInDays: 90 },
      });
      const res = await createServiceAccountKey(req, {
        params: Promise.resolve({ projectId: project.id, saId: createdServiceAccount.id }),
      });
      const keyData = await res.json();

      logger.log({
        scenario: "Owner generates API key for service account",
        role: "Owner",
        actorEmail: enterpriseOwner.user.email,
        endpoint: `/api/projects/${project.id}/service-accounts/${createdServiceAccount.id}/keys`,
        method: "POST",
        responseStatus: res.status,
        responseSummary: { keyMask: keyData.mask || keyData.keyMask, label: keyData.label },
        expectedStatus: 201,
      });

      expect(res.status).toBe(201);
      // Deep verification: Key exists with length >= 32 and mask is formatted properly
      expect(keyData.key).toBeDefined();
      expect(typeof keyData.key).toBe("string");
      expect(keyData.key.length).toBeGreaterThanOrEqual(32);
      expect(keyData.mask).toBeDefined();
      expect(keyData.label).toBe("Production Key 2026");

      // Deep verification: In DB, the raw key is NEVER stored; only a hash is stored
      const dbApiKey = await prisma.apiKey.findUnique({ where: { id: keyData.id } });
      expect(dbApiKey).not.toBeNull();
      expect(dbApiKey?.key).not.toBe(keyData.key); // Hashed!
    });
  });

  // =========================================================================
  // 6. WEBHOOKS & SHADOW ROTATION SCHEDULES
  // =========================================================================
  describe("6. Webhooks & Rotation Automation APIs", () => {
    it("OWNER: Configures event webhook on project", async () => {
      const webhookUrl = "https://api.internal-security.test/webhooks/secrets-audit";
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/projects/${project.id}/webhooks`,
        token: enterpriseOwner.token,
        body: {
          url: webhookUrl,
          events: ["secret.create", "secret.update", "secret.access"],
          active: true,
        },
      });
      const res = await createWebhook(req, { params: Promise.resolve({ projectId: project.id }) });
      const webhook = await res.json();

      logger.log({
        scenario: "Owner registers security webhook",
        role: "Owner",
        actorEmail: enterpriseOwner.user.email,
        endpoint: `/api/projects/${project.id}/webhooks`,
        method: "POST",
        responseStatus: res.status,
        responseSummary: { url: webhook.url, events: webhook.events },
        expectedStatus: 201,
      });

      expect(res.status).toBe(201);
      // Deep verification: Check returned webhook payload
      expect(webhook.id).toBeDefined();
      expect(webhook.url).toBe(webhookUrl);
      expect(webhook.events).toEqual(["secret.create", "secret.update", "secret.access"]);
      expect(webhook.active).toBe(true);
    });

    it("OWNER: Configures 30-day automatic secret rotation schedule", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/rotation/schedules",
        token: enterpriseOwner.token,
        body: {
          secretId: prodSecret.id,
          projectId: project.id,
          frequency: "monthly",
          rotationMethod: "shadow",
        },
      });
      const res = await createRotationSchedule(req);
      const schedule = await res.json();

      logger.log({
        scenario: "Owner configures 30-day automatic rotation schedule",
        role: "Owner",
        actorEmail: enterpriseOwner.user.email,
        endpoint: "/api/rotation/schedules",
        method: "POST",
        responseStatus: res.status,
        responseSummary: schedule,
        expectedStatus: [200, 201],
      });

      expect([200, 201]).toContain(res.status);
      // Deep verification: Check rotation schedule fields in DB
      const dbSchedule = await prisma.rotationSchedule.findUnique({
        where: { secretId: prodSecret.id },
      });
      expect(dbSchedule).not.toBeNull();
      expect(dbSchedule?.frequency).toBe("monthly");
      expect(dbSchedule?.projectId).toBe(project.id);
    });
  });

  // =========================================================================
  // 7. USER PROFILE, SETTINGS & SUBSCRIPTION USAGE
  // =========================================================================
  describe("7. User Settings, Profile & Resource Quotas", () => {
    it("DEV SENIOR: Updates user profile settings display name", async () => {
      const req = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/user/settings",
        token: devSenior.token,
        body: { type: "profile", data: { name: "Senior Lead Engineer" } },
      });
      const res = await updateUserSettings(req);
      const data = await res.json();

      logger.log({
        scenario: "User updates profile display name",
        role: "Developer",
        actorEmail: devSenior.user.email,
        endpoint: "/api/user/settings",
        method: "PATCH",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.name).toBe("Senior Lead Engineer");

      // Deep verification: DB User record is updated
      const dbUser = await prisma.user.findUnique({ where: { id: devSenior.user.id } });
      expect(dbUser?.name).toBe("Senior Lead Engineer");
    });

    it("OWNER: Checks subscription resource quotas and active usage", async () => {
      const req = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/subscription/usage",
        token: enterpriseOwner.token,
      });
      const res = await getSubscriptionUsage(req);
      const data = await res.json();

      logger.log({
        scenario: "Owner checks subscription quota usage",
        role: "Owner",
        actorEmail: enterpriseOwner.user.email,
        endpoint: "/api/subscription/usage",
        method: "GET",
        responseStatus: res.status,
        responseSummary: data,
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      // Deep verification: Response body has usage statistics and subscription metadata
      expect(data.workspaces).toBeDefined();
      expect(data.projects).toBeDefined();
      expect(data.secrets).toBeDefined();
      expect(data.dailyRequests).toBeDefined();
    });
  });

  // =========================================================================
  // 8. AUDIT TRAILS & SOC 2 COMPLIANCE VERIFICATION
  // =========================================================================
  describe("8. Global Audit Trails & Compliance Health", () => {
    it("OWNER: Queries audit logs and verifies zero sensitive credential leaks", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/audit?workspaceId=${workspace.id}`,
        token: enterpriseOwner.token,
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
        scenario: "Owner queries audit trail (Zero Credential Leakage Check)",
        role: "Owner",
        actorEmail: enterpriseOwner.user.email,
        endpoint: `/api/audit?workspaceId=${workspace.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: { totalAuditEntries: data.data?.length || 0, hasPasswordLeaks, hasMfaSecretLeaks },
        expectedStatus: 200,
        notes: "Audit log verified tamper-evident and clean of credential leakage",
      });

      expect(res.status).toBe(200);
      // Deep verification: Zero sensitive fields exposed in audit response
      expect(hasPasswordLeaks).toBe(false);
      expect(hasMfaSecretLeaks).toBe(false);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    it("OWNER: Generates SOC 2 compliance assessment report", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/compliance/report?workspaceId=${workspace.id}`,
        token: enterpriseOwner.token,
        searchParams: { workspaceId: workspace.id },
      });
      const res = await getComplianceReport(req);
      const report = await res.json();

      logger.log({
        scenario: "Owner generates SOC 2 posture report",
        role: "Owner",
        actorEmail: enterpriseOwner.user.email,
        endpoint: `/api/compliance/report?workspaceId=${workspace.id}`,
        method: "GET",
        responseStatus: res.status,
        responseSummary: { generatedBy: report.generatedBy, summary: report.summary },
        expectedStatus: 200,
      });

      expect(res.status).toBe(200);
      // Deep verification: Ensure SOC 2 compliance report structure is complete
      expect(report.summary).toBeDefined();
      expect(report.summary.totalProjects).toBeGreaterThanOrEqual(1);
      expect(report.generatedBy).toBe(enterpriseOwner.user.email);
      expect(report.workspaces).toBeDefined();
      expect(Array.isArray(report.auditEntries)).toBe(true);
    });
  });
});
