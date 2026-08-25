import { GET as getSecrets, POST as createSecret, PUT as updateSecret } from "@/app/api/secret/route";
import { POST as rollbackSecret } from "@/app/api/secret/rollback/route";
import { POST as addProjectIp, DELETE as removeProjectIp } from "@/app/api/project/[id]/ip/route";
import { POST as handleBranchPost } from "@/app/api/branch/route";
import { DELETE as removeTeamMember } from "@/app/api/team/remove/route";
import { provisionAllTestUsers, SeededUser } from "./helpers/seed-users";
import { createMockRequest, cleanupUserResources, createTestWorkspace, createTestProject, createTestBranch, createTestTeam } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";
import { decrypt, encrypt } from "@/lib/encription";
import { generateApiKey } from "@/lib/auth/service-account";

describe("E2E Security Edge Cases: Team Roles, IP Firewall, Account Invalidation & Secret History", () => {
  let userMap: Record<string, { user: any; token: string; credentials: SeededUser }>;

  let enterpriseOwner: { user: any; token: string };
  let teamAdmin: { user: any; token: string };
  let devSenior: { user: any; token: string };
  let auditorViewer: { user: any; token: string };
  let contractor: { user: any; token: string };

  let workspace: any;
  let team: any;
  let project: any;
  let mainBranch: any;
  let devSecret: any;
  let prodSecret: any;
  let contractorTeamUser: any;

  beforeAll(async () => {
    userMap = await provisionAllTestUsers();

    enterpriseOwner = userMap["owner.enterprise@xtrasecurity.test"];
    teamAdmin = userMap["admin.team@xtrasecurity.test"];
    devSenior = userMap["dev.senior@xtrasecurity.test"];
    auditorViewer = userMap["auditor.viewer@xtrasecurity.test"];
    contractor = userMap["contractor@external-vendor.test"];

    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);

    // 1. Setup Workspace & Team
    workspace = await createTestWorkspace(enterpriseOwner.user, "FinTech Core Security Workspace");
    team = await createTestTeam(enterpriseOwner.user, workspace.id, { name: "Multi-Role Engineering Squad" });

    // 2. Add members with different roles into the SAME team
    await prisma.teamUser.createMany({
      data: [
        { teamId: team.id, userId: teamAdmin.user.id, role: "admin", status: "active" },
        { teamId: team.id, userId: devSenior.user.id, role: "developer", status: "active" },
        { teamId: team.id, userId: auditorViewer.user.id, role: "viewer", status: "active" },
      ],
    });

    contractorTeamUser = await prisma.teamUser.create({
      data: { teamId: team.id, userId: contractor.user.id, role: "developer", status: "active" },
    });

    // 3. Attach Team to Project via TeamProject
    project = await createTestProject(enterpriseOwner.user, workspace.id, {
      name: "Payment Gateway Microservice",
      description: "Handles credit card tokenization",
    });

    await prisma.teamProject.create({
      data: { teamId: team.id, projectId: project.id },
    });

    mainBranch = await createTestBranch(enterpriseOwner.user, project.id, { name: "main" });

    // 4. Create Baseline Secrets
    const devEncrypted = JSON.stringify(encrypt("postgres://dev_user:secret123@dev-db.internal:5432/app"));
    devSecret = await prisma.secret.create({
      data: {
        key: "PAYMENT_DEV_DATABASE_URL",
        value: [devEncrypted],
        description: "Development DB URI",
        environmentType: "development",
        type: "string",
        version: "1",
        projectId: project.id,
        branchId: mainBranch.id,
        updatedBy: devSenior.user.id,
        permission: [],
        rotationPolicy: "manual",
        history: [{ version: "1", value: [devEncrypted], description: "Initial creation", updatedAt: new Date().toISOString() }],
      },
    });

    const prodEncrypted = JSON.stringify(encrypt("sk_live_stripe_999888777666555444"));
    prodSecret = await prisma.secret.create({
      data: {
        key: "STRIPE_PRODUCTION_API_KEY",
        value: [prodEncrypted],
        description: "Production Stripe Secret Key",
        environmentType: "production",
        type: "string",
        version: "1",
        projectId: project.id,
        branchId: mainBranch.id,
        updatedBy: enterpriseOwner.user.id,
        permission: [],
        rotationPolicy: "manual",
        history: [{ version: "1", value: [prodEncrypted], description: "Initial creation", updatedAt: new Date().toISOString() }],
      },
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
  // 1. SAME TEAM, DIFFERENT ROLES ON ASSIGNED PROJECT
  // =========================================================================
  describe("1. Multi-Role RBAC within the Same Team", () => {
    it("ADMIN: Can manage project IP firewall rules", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/project/${project.id}/ip`,
        token: teamAdmin.token,
        body: { ip: "198.51.100.10", description: "Admin Bastion" },
      });
      const res = await addProjectIp(req, { params: Promise.resolve({ id: project.id }) });
      expect(res.status).toBe(200);

      // Clean up IP so subsequent tests aren't firewalled
      const delReq = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/project/${project.id}/ip`,
        token: teamAdmin.token,
        body: { ip: "198.51.100.10" },
      });
      await removeProjectIp(delReq, { params: Promise.resolve({ id: project.id }) });
    });

    it("DEVELOPER: Can read and decrypt Development secrets", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: devSenior.token,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      const secrets = await res.json();
      expect(res.status).toBe(200);

      const targetDevSecret = secrets.find((s: any) => s.id === devSecret.id);
      expect(targetDevSecret).toBeDefined();
      expect(targetDevSecret.value).toBe("postgres://dev_user:secret123@dev-db.internal:5432/app");
    });

    it("DEVELOPER: Is BLOCKED (403) from updating Production secrets", async () => {
      const req = createMockRequest({
        method: "PUT",
        url: `http://localhost:3000/api/secret?id=${prodSecret.id}`,
        token: devSenior.token,
        searchParams: { id: prodSecret.id },
        body: { id: prodSecret.id, value: "hacked_prod_key" },
      });
      const res = await updateSecret(req, {});
      expect(res.status).toBe(403);
    });

    it("VIEWER: Reads secrets with values safely masked as [REDACTED]", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: auditorViewer.token,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      const secrets = await res.json();
      expect(res.status).toBe(200);

      const targetDevSecret = secrets.find((s: any) => s.id === devSecret.id);
      expect(targetDevSecret.value).toBe("[REDACTED]");
    });

    it("VIEWER: Is BLOCKED (403) from creating secrets or branches", async () => {
      // 1. Blocked from creating branch
      const branchReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/branch",
        token: auditorViewer.token,
        body: { name: "unauthorized-branch", projectId: project.id },
      });
      const branchRes = await handleBranchPost(branchReq);
      expect(branchRes.status).toBe(403);

      // 2. Blocked from creating secret
      const secretReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: auditorViewer.token,
        body: { key: "VIEWER_KEY", value: "test", projectId: project.id, environmentType: "development" },
      });
      const secretRes = await createSecret(secretReq, {});
      expect(secretRes.status).toBe(403);
    });
  });

  // =========================================================================
  // 2. LIVE IP ALLOWLIST RESTRICTION ENFORCEMENT
  // =========================================================================
  describe("2. IP Whitelisting & Firewall Enforcement", () => {
    it("Enforces IP allowlist: Allowlisted IP passes (200), non-allowlisted IP blocked (403)", async () => {
      // 1. Admin adds IP restriction '198.51.100.22'
      const addReq = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/project/${project.id}/ip`,
        token: teamAdmin.token,
        body: { ip: "198.51.100.22", description: "Allowed Corporate Gateway" },
      });
      const addRes = await addProjectIp(addReq, { params: Promise.resolve({ id: project.id }) });
      expect(addRes.status).toBe(200);

      // 2. Developer sends request from ALLOWLISTED IP '198.51.100.22' -> 200 OK
      const allowedReq = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: devSenior.token,
        searchParams: { projectId: project.id },
        headers: { "x-forwarded-for": "198.51.100.22" },
      });
      const allowedRes = await getSecrets(allowedReq, {});
      expect(allowedRes.status).toBe(200);

      // 3. Developer sends request from NON-ALLOWLISTED IP '203.0.113.88' -> 403 Forbidden
      const blockedReq = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: devSenior.token,
        searchParams: { projectId: project.id },
        headers: { "x-forwarded-for": "203.0.113.88" },
      });
      const blockedRes = await getSecrets(blockedReq, {});
      expect(blockedRes.status).toBe(403);
      const blockedData = await blockedRes.json();
      expect(blockedData.error || blockedData.message).toBeDefined();

      // 4. Remove IP restriction to restore general access
      const delReq = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/project/${project.id}/ip`,
        token: teamAdmin.token,
        body: { ip: "198.51.100.22" },
      });
      const delRes = await removeProjectIp(delReq, { params: Promise.resolve({ id: project.id }) });
      expect(delRes.status).toBe(200);

      // 5. Verify non-allowlisted IP can now access again
      const restoredReq = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: devSenior.token,
        searchParams: { projectId: project.id },
        headers: { "x-forwarded-for": "203.0.113.88" },
      });
      const restoredRes = await getSecrets(restoredReq, {});
      expect(restoredRes.status).toBe(200);
    });
  });

  // =========================================================================
  // 3. REMOVED TEAM MEMBER & DELETED USER ACCOUNT INVALIDATION
  // =========================================================================
  describe("3. Removed Member & Deleted Account Invalidation", () => {
    it("REMOVED MEMBER: Removing user from team immediately cuts off project access (403)", async () => {
      // 1. Verify contractor currently has access
      const accessReqBefore = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: contractor.token,
        searchParams: { projectId: project.id },
      });
      const resBefore = await getSecrets(accessReqBefore, {});
      expect(resBefore.status).toBe(200);

      // 2. Owner removes contractor from team
      const removeReq = createMockRequest({
        method: "DELETE",
        url: "http://localhost:3000/api/team/remove",
        token: enterpriseOwner.token,
        body: { memberId: contractorTeamUser.id },
      });
      const removeRes = await removeTeamMember(removeReq);
      expect(removeRes.status).toBe(200);

      // 3. Contractor's subsequent request is immediately rejected with 403
      const accessReqAfter = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: contractor.token,
        searchParams: { projectId: project.id },
      });
      const resAfter = await getSecrets(accessReqAfter, {});
      expect(resAfter.status).toBe(403);
    });

    it("DELETED USER: API key belonging to deleted user is rejected with 401 Unauthorized", async () => {
      // 1. Create a temporary user with an API Key
      const tempUser = await prisma.user.create({
        data: {
          email: "ephemeral-test-user@xtrasecurity.test",
          name: "Ephemeral Test User",
          password: "hashedPassword123!",
          role: "user",
          tier: "free",
        },
      });

      const { key, hash, mask } = generateApiKey();
      const apiKeyRecord = await prisma.apiKey.create({
        data: {
          key: hash,
          label: "Temporary Test Key",
          keyMask: mask,
          userId: tempUser.id,
        },
      });

      // 2. Delete the temporary user from the database
      await prisma.user.delete({ where: { id: tempUser.id } });

      // 3. Make an authenticated request using the deleted user's API key
      const req = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/user/settings",
        apiKey: key,
      });
      const { GET: getUserSettings } = await import("@/app/api/user/settings/route");
      const res = await getUserSettings(req);
      expect(res.status).toBe(401);

      // Clean up orphaned apiKey record
      await prisma.apiKey.deleteMany({ where: { id: apiKeyRecord.id } });
    });
  });

  // =========================================================================
  // 4. SECRET HISTORY IMMUTABILITY & AUDIT TRAIL PRESERVATION
  // =========================================================================
  describe("4. Secret History Immutability & Rollback Append-Only Audit", () => {
    it("Preserves complete, encrypted version history across updates and rollbacks", async () => {
      // 1. Check initial history (v1)
      const initialSecret = await prisma.secret.findUnique({ where: { id: devSecret.id } });
      const initialHistory = initialSecret?.history as any[];
      expect(initialHistory.length).toBe(1);
      expect(initialHistory[0].version).toBe("1");

      // 2. Update secret to v2
      const updateReq = createMockRequest({
        method: "PUT",
        url: `http://localhost:3000/api/secret?id=${devSecret.id}`,
        token: devSenior.token,
        searchParams: { id: devSecret.id },
        body: { id: devSecret.id, value: "postgres://dev_user:v2_password@dev-db.internal:5432/app" },
      });
      const updateRes = await updateSecret(updateReq, {});
      expect(updateRes.status).toBe(200);

      // Verify history grew to 2 entries
      const v2Secret = await prisma.secret.findUnique({ where: { id: devSecret.id } });
      const v2History = v2Secret?.history as any[];
      expect(v2History.length).toBe(2);
      expect(v2History.some((h: any) => h.version === "2")).toBe(true);
      expect(v2History.some((h: any) => h.version === "1")).toBe(true);

      // Verify all historical values in MongoDB are encrypted (never plaintext)
      for (const entry of v2History) {
        const encryptedJson = typeof entry.value === "string" ? entry.value : entry.value[0];
        const parsed = JSON.parse(encryptedJson);
        expect(parsed.encryptedData).toBeDefined();
        expect(parsed.iv).toBeDefined();
        expect(parsed.authTag).toBeDefined();
      }

      // 3. Rollback secret to v1
      const rollbackReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/rollback",
        token: devSenior.token,
        body: { secretId: devSecret.id, targetVersion: "1", changeReason: "Reverting broken config" },
      });
      const rollbackRes = await rollbackSecret(rollbackReq);
      expect(rollbackRes.status).toBe(200);

      // 4. Verify rollback created a new append-only version "3" (history length = 3)
      const v3Secret = await prisma.secret.findUnique({ where: { id: devSecret.id } });
      expect(v3Secret?.version).toBe("3");
      const v3History = v3Secret?.history as any[];
      expect(v3History.length).toBe(3);
      expect(v3History.some((h: any) => h.version === "3")).toBe(true);

      // 5. Decrypt current value and verify it restored original v1 plaintext
      const currentCiphertext = JSON.parse(v3Secret!.value[0]);
      const currentPlaintext = decrypt(currentCiphertext);
      expect(currentPlaintext).toBe("postgres://dev_user:secret123@dev-db.internal:5432/app");
    });
  });
});
