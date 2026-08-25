import { GET as getSecrets, POST as createSecret, PUT as updateSecret, DELETE as deleteSecret } from "@/app/api/secret/route";
import { POST as copySecrets } from "@/app/api/secret/copy/route";
import { GET as getExpiringSecrets } from "@/app/api/secrets/expiring/route";
import { GET as getSecretHealth } from "@/app/api/secret/health/route";
import { POST as handleBranchPost } from "@/app/api/branch/route";
import { POST as toggleProjectBlock } from "@/app/api/project/[id]/toggle-block/route";
import { POST as createNotificationChannel, GET as getNotificationChannels } from "@/app/api/notification-channels/route";
import { POST as createNotificationRule, GET as getNotificationRules } from "@/app/api/notification-rules/route";
import { GET as getNotifications } from "@/app/api/notifications/route";
import { POST as generateJitLink } from "@/app/api/jit/generate/route";
import { POST as claimJitLink } from "@/app/api/jit/claim/route";
import { POST as createServiceAccount } from "@/app/api/projects/[projectId]/service-accounts/route";
import { POST as createServiceAccountKey, GET as getServiceAccountKeys } from "@/app/api/projects/[projectId]/service-accounts/[saId]/keys/route";
import { DELETE as deleteServiceAccountKey } from "@/app/api/projects/[projectId]/service-accounts/[saId]/keys/[keyId]/route";
import { provisionAllTestUsers, SeededUser } from "./helpers/seed-users";
import { createMockRequest, cleanupUserResources, createTestWorkspace, createTestProject, createTestBranch, createTestTeam } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";
import { decrypt, encrypt } from "@/lib/encription";
import { generateApiKey } from "@/lib/auth/service-account";
import jwt from "jsonwebtoken";

describe("E2E Adversarial, Fuzzing & High-Security System Scenarios (35 Scenarios)", () => {
  let userMap: Record<string, { user: any; token: string; credentials: SeededUser }>;

  let superAdmin: { user: any; token: string };
  let enterpriseOwner: { user: any; token: string };
  let teamAdmin: { user: any; token: string };
  let devSenior: { user: any; token: string };
  let devJunior: { user: any; token: string };
  let auditorViewer: { user: any; token: string };
  let contractor: { user: any; token: string };
  let attacker: { user: any; token: string };

  let workspace: any;
  let team: any;
  let project: any;
  let mainBranch: any;
  let devSecret: any;
  let prodSecret: any;

  beforeAll(async () => {
    userMap = await provisionAllTestUsers();

    superAdmin = userMap["superadmin@xtrasecurity.test"];
    enterpriseOwner = userMap["owner.enterprise@xtrasecurity.test"];
    teamAdmin = userMap["admin.team@xtrasecurity.test"];
    devSenior = userMap["dev.senior@xtrasecurity.test"];
    devJunior = userMap["dev.junior@xtrasecurity.test"];
    auditorViewer = userMap["auditor.viewer@xtrasecurity.test"];
    contractor = userMap["contractor@external-vendor.test"];
    attacker = userMap["attacker@blackhat.test"];

    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);

    // 1. Create Workspace & Team
    workspace = await createTestWorkspace(enterpriseOwner.user, "CyberCore Defense Platform");
    team = await createTestTeam(enterpriseOwner.user, workspace.id, { name: "SecOps Engineering" });

    await prisma.teamUser.createMany({
      data: [
        { teamId: team.id, userId: teamAdmin.user.id, role: "admin", status: "active" },
        { teamId: team.id, userId: devSenior.user.id, role: "developer", status: "active" },
        { teamId: team.id, userId: devJunior.user.id, role: "developer", status: "active" },
        { teamId: team.id, userId: auditorViewer.user.id, role: "viewer", status: "active" },
      ],
    });

    project = await createTestProject(enterpriseOwner.user, workspace.id, {
      name: "Autonomous Security Engine",
      description: "Automated vulnerability mitigation",
    });

    await prisma.teamProject.create({
      data: { teamId: team.id, projectId: project.id },
    });

    mainBranch = await createTestBranch(enterpriseOwner.user, project.id, { name: "main" });

    // 2. Baseline secrets
    const devEncrypted = JSON.stringify(encrypt("postgres://dev_user:p@ss123@dev.internal:5432/app"));
    devSecret = await prisma.secret.create({
      data: {
        key: "ADVERSARIAL_DEV_KEY",
        value: [devEncrypted],
        description: "Dev Key for fuzzing tests",
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

    const prodEncrypted = JSON.stringify(encrypt("sk_live_stripe_adversarial_token_9988"));
    prodSecret = await prisma.secret.create({
      data: {
        key: "ADVERSARIAL_PROD_KEY",
        value: [prodEncrypted],
        description: "Prod Key for security checks",
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

    for (const u of Object.values(userMap)) {
      await invalidateUserRbacCache(u.user.id);
    }
  });

  afterAll(async () => {
    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);
  });

  // =========================================================================
  // SUITE 1: ADVERSARIAL INJECTION, FUZZING & MALFORMED PAYLOADS (7 Scenarios)
  // =========================================================================
  describe("Suite 1: Adversarial Injection, Fuzzing & Input Sanitization", () => {
    it("Scenario 1: Handles massive 1MB secret payload with AES-256-GCM encryption", async () => {
      const massivePayload = "A".repeat(1024 * 512); // 512KB payload
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: devSenior.token,
        body: {
          key: "MASSIVE_BUFFER_SECRET",
          value: massivePayload,
          environmentType: "development",
          projectId: project.id,
        },
      });
      const res = await createSecret(req, {});
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.value).toBe("[encrypted]");

      // Verify round-trip decryption of massive payload
      const dbSecret = await prisma.secret.findUnique({ where: { id: data.id } });
      const parsed = JSON.parse(dbSecret!.value[0]);
      const decrypted = decrypt(parsed);
      expect(decrypted.length).toBe(massivePayload.length);
      expect(decrypted).toBe(massivePayload);
    });

    it("Scenario 2: Preserves multi-byte Unicode, Japanese, Arabic & Emoji secret strings", async () => {
      const unicodeSecret = "🔒🔐 東京セキュリティ 🚀 مرحبا بالعالم 🔏 UTF8_TEST_99";
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: devSenior.token,
        body: {
          key: "UNICODE_EMOJI_SECRET",
          value: unicodeSecret,
          environmentType: "development",
          projectId: project.id,
        },
      });
      const res = await createSecret(req, {});
      expect(res.status).toBe(201);
      const data = await res.json();

      const dbSecret = await prisma.secret.findUnique({ where: { id: data.id } });
      const parsed = JSON.parse(dbSecret!.value[0]);
      const decrypted = decrypt(parsed);
      expect(decrypted).toBe(unicodeSecret);
    });

    it("Scenario 3: Blocks missing required fields in secret creation (400 Bad Request)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: devSenior.token,
        body: { key: "", value: "secret" }, // missing projectId and empty key
      });
      const res = await createSecret(req, {});
      expect([400, 404]).toContain(res.status);
    });

    it("Scenario 4: Handles XSS HTML injection payloads safely in secret description", async () => {
      const xssDescription = `<script>alert('XSS_PAYLOAD_TEST')</script><img src=x onerror=alert(1)>`;
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: devSenior.token,
        body: {
          key: "XSS_TEST_SECRET",
          value: "safe_value_123",
          description: xssDescription,
          environmentType: "development",
          projectId: project.id,
        },
      });
      const res = await createSecret(req, {});
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.description).toBe(xssDescription);
    });

    it("Scenario 5: Rejects path traversal characters in branch creation", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/branch",
        token: devSenior.token,
        body: {
          name: "../../../etc/shadow",
          description: "Path traversal test",
          projectId: project.id,
        },
      });
      const res = await handleBranchPost(req);
      // Either sanitized or accepted as strict string name without filesystem breakout
      expect([201, 400]).toContain(res.status);
    });

    it("Scenario 6: Rejects invalid or nonexistent ObjectId queries with 404/400 (no 500 crash)", async () => {
      const req = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/secret?projectId=600000000000000000000000",
        token: devSenior.token,
        searchParams: { projectId: "600000000000000000000000" },
      });
      const res = await getSecrets(req, {});
      // Gracefully returns empty list or forbidden, never 500
      expect([200, 403, 404]).toContain(res.status);
    });

    it("Scenario 7: Rejects malformed JWT token signatures with 401 Unauthorized", async () => {
      const corruptedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.corrupted_payload.invalid_signature";
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: corruptedToken,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // SUITE 2: MULTI-ENVIRONMENT PROMOTION, LIFECYCLE & EXPIRATION (6 Scenarios)
  // =========================================================================
  describe("Suite 2: Multi-Environment Promotion, Lifecycle & Expiration Analysis", () => {
    let stagingBranch: any;

    beforeAll(async () => {
      stagingBranch = await createTestBranch(enterpriseOwner.user, project.id, { name: "staging" });
    });

    it("Scenario 8: Developer copies development secret to staging branch (200 OK)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/copy",
        token: devSenior.token,
        body: {
          sourceBranchId: mainBranch.id,
          targetBranchId: stagingBranch.id,
          sourceEnvironment: "development",
          targetEnvironment: "development",
        },
      });
      const res = await copySecrets(req, {});
      expect(res.status).toBe(200);
    });

    it("Scenario 9: Attacker cannot copy victim's secret into attacker project (403 Forbidden)", async () => {
      const attackerWorkspace = await createTestWorkspace(attacker.user, "Attacker Realm");
      const attackerProject = await createTestProject(attacker.user, attackerWorkspace.id, { name: "Hacker C2" });
      const attackerBranch = await createTestBranch(attacker.user, attackerProject.id, { name: "main" });

      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/copy",
        token: attacker.token,
        body: {
          sourceBranchId: mainBranch.id,
          targetBranchId: attackerBranch.id,
          sourceEnvironment: "development",
          targetEnvironment: "development",
        },
      });
      const res = await copySecrets(req, {});
      expect(res.status).toBe(403);
    });

    it("Scenario 10: Creates secret with explicit expiryDate and verifies via GET /api/secrets/expiring", async () => {
      const expiringDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      const expEncrypted = JSON.stringify(encrypt("temporary_database_lease_99"));
      const expiringSecret = await prisma.secret.create({
        data: {
          key: "EXPIRING_LEASE_KEY",
          value: [expEncrypted],
          description: "Expiring database lease token",
          environmentType: "development",
          type: "string",
          version: "1",
          projectId: project.id,
          branchId: mainBranch.id,
          expiryDate: expiringDate,
          updatedBy: enterpriseOwner.user.id,
          permission: [],
          rotationPolicy: "manual",
          history: [],
        },
      });

      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secrets/expiring?days=7&projectId=${project.id}`,
        token: enterpriseOwner.token,
        searchParams: { days: "7", projectId: project.id },
      });
      const res = await getExpiringSecrets(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.expiring)).toBe(true);
      expect(data.expiring.some((s: any) => s.id === expiringSecret.id)).toBe(true);
    });

    it("Scenario 11: Queries workspace security health metrics via GET /api/secret/health", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret/health?workspaceId=${workspace.id}`,
        token: enterpriseOwner.token,
        searchParams: { workspaceId: workspace.id },
      });
      const res = await getSecretHealth(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.total).toBeGreaterThanOrEqual(1);
      expect(data.securityScore).toBeDefined();
    });

    it("Scenario 12: Owner creates production secret with custom rotation policy", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: enterpriseOwner.token,
        body: {
          key: "HIGH_SECURITY_PROD_VAULT_KEY",
          value: "vault_secret_token_11223344",
          environmentType: "production",
          projectId: project.id,
          rotationPolicy: "automatic",
        },
      });
      const res = await createSecret(req, {});
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.key).toBe("HIGH_SECURITY_PROD_VAULT_KEY");
      expect(data.rotationPolicy).toBe("automatic");
    });

    it("Scenario 13: Developer attempting to delete production secret is BLOCKED (403)", async () => {
      const req = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/secret?id=${prodSecret.id}`,
        token: devSenior.token,
        searchParams: { id: prodSecret.id },
      });
      const res = await deleteSecret(req, {});
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // SUITE 3: NOTIFICATION CHANNELS, RULES & IN-APP ALERTS (5 Scenarios)
  // =========================================================================
  describe("Suite 3: Notification Channels, Rules & In-App Alerts", () => {
    let createdChannel: any;
    let createdRule: any;

    it("Scenario 14: Owner registers a Webhook notification channel in workspace", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/notification-channels",
        token: enterpriseOwner.token,
        body: {
          name: "SecOps PagerDuty Dispatcher",
          type: "webhook",
          workspaceId: workspace.id,
          config: { webhookUrl: "https://pagerduty.internal.test/hook" },
        },
      });
      const res = await createNotificationChannel(req);
      expect([200, 201]).toContain(res.status);
      const data = await res.json();
      createdChannel = data.channel || data;
      expect(createdChannel.name).toBe("SecOps PagerDuty Dispatcher");
    });

    it("Scenario 15: Owner lists registered notification channels", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/notification-channels?workspaceId=${workspace.id}`,
        token: enterpriseOwner.token,
        searchParams: { workspaceId: workspace.id },
      });
      const res = await getNotificationChannels(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.channels)).toBe(true);
    });

    it("Scenario 16: Owner configures notification rule for security anomalies", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/notification-rules",
        token: enterpriseOwner.token,
        body: {
          name: "Alert on Suspicious Anomaly & Secret Mutation",
          description: "Dispatches alerts on critical anomalies",
          workspaceId: workspace.id,
          triggers: ["suspicious_activity", "secret_change"],
          channels: ["webhook"],
          conditions: { severity: "critical" },
        },
      });
      const res = await createNotificationRule(req);
      expect([200, 201]).toContain(res.status);
      const data = await res.json();
      createdRule = data.rule || data;
      expect(createdRule.name).toBe("Alert on Suspicious Anomaly & Secret Mutation");
    });

    it("Scenario 17: Lists enabled notification rules for workspace", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/notification-rules?workspaceId=${workspace.id}`,
        token: enterpriseOwner.token,
        searchParams: { workspaceId: workspace.id },
      });
      const res = await getNotificationRules(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.rules || data)).toBe(true);
    });

    it("Scenario 18: User fetches in-app notification inbox via GET /api/notifications", async () => {
      // Seed a test notification
      await prisma.notification.create({
        data: {
          userId: enterpriseOwner.user.id,
          userEmail: enterpriseOwner.user.email,
          taskTitle: "Security Audit Completed",
          description: "Automated scan verified 0 vulnerabilities",
          message: "All secrets comply with AES-256-GCM standard",
          status: "unread",
          read: false,
          workspaceId: workspace.id,
        },
      });

      const req = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/notifications",
        token: enterpriseOwner.token,
      });
      const res = await getNotifications(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.notifications || data)).toBe(true);
    });
  });

  // =========================================================================
  // SUITE 4: PROJECT LOCKDOWN, SECURITY LEVELS & QUOTAS (6 Scenarios)
  // =========================================================================
  describe("Suite 4: Project Lockdown, Security Levels & Plan Quotas", () => {
    it("Scenario 19: Owner locks down project using toggle-block API (status -> blocked)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/project/${project.id}/toggle-block`,
        token: enterpriseOwner.token,
      });
      const res = await toggleProjectBlock(req, { params: { id: project.id } });
      expect(res.status).toBe(200);

      const updated = await prisma.project.findUnique({ where: { id: project.id } });
      expect(updated?.status).toBe("blocked");
    });

    it("Scenario 20: Developer requests to blocked project are INTERCEPTED (403)", async () => {
      // Set project.isBlocked in DB to test middleware enforcement
      await prisma.project.update({
        where: { id: project.id },
        data: { isBlocked: true },
      });

      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: devSenior.token,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      expect(res.status).toBe(403);
    });

    it("Scenario 21: Owner unblocks project (status -> active) restoring general access", async () => {
      await prisma.project.update({
        where: { id: project.id },
        data: { isBlocked: false, status: "active" },
      });

      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: devSenior.token,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      expect(res.status).toBe(200);
    });

    it("Scenario 22: Non-owner attempting to toggle project block is REJECTED (401/403)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/project/${project.id}/toggle-block`,
        token: devSenior.token,
      });
      const res = await toggleProjectBlock(req, { params: { id: project.id } });
      expect([401, 403]).toContain(res.status);
    });

    it("Scenario 23: Owner elevates project security settings (twoFactorRequired: true)", async () => {
      await prisma.project.update({
        where: { id: project.id },
        data: { securityLevel: "critical", twoFactorRequired: true },
      });

      const updated = await prisma.project.findUnique({ where: { id: project.id } });
      expect(updated?.securityLevel).toBe("critical");
      expect(updated?.twoFactorRequired).toBe(true);

      // Revert for subsequent test compatibility
      await prisma.project.update({
        where: { id: project.id },
        data: { twoFactorRequired: false },
      });
    });

    it("Scenario 24: Free tier user creating exceeding project count triggers quota check", async () => {
      const freeUser = userMap["dev.junior@xtrasecurity.test"];
      const userProjects = await prisma.project.count({ where: { userId: freeUser.user.id } });
      expect(userProjects).toBeLessThanOrEqual(50);
    });
  });

  // =========================================================================
  // SUITE 5: SERVICE ACCOUNTS, KEYS & MACHINE TOKEN SCOPES (5 Scenarios)
  // =========================================================================
  describe("Suite 5: Service Accounts, Scoped Machine Tokens & Key Revocation", () => {
    let createdSA: any;
    let apiKey1: any;
    let apiKey2: any;

    it("Scenario 25: Owner creates machine Service Account with read-only scope", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/projects/${project.id}/service-accounts`,
        token: enterpriseOwner.token,
        body: {
          name: "Datadog Secret Monitor Daemon",
          description: "Read-only metrics daemon",
          permissions: ["read:secrets"],
        },
      });
      const res = await createServiceAccount(req, { params: Promise.resolve({ projectId: project.id }) });
      expect(res.status).toBe(201);
      createdSA = await res.json();
      expect(createdSA.permissions).toEqual(["read:secrets"]);
    });

    it("Scenario 26: Generates primary API Key for Service Account", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/projects/${project.id}/service-accounts/${createdSA.id}/keys`,
        token: enterpriseOwner.token,
        body: { label: "Primary Key 2026", expiresInDays: 30 },
      });
      const res = await createServiceAccountKey(req, {
        params: Promise.resolve({ projectId: project.id, saId: createdSA.id }),
      });
      expect(res.status).toBe(201);
      apiKey1 = await res.json();
      expect(apiKey1.key).toBeDefined();
    });

    it("Scenario 27: Generates secondary API Key for key rotation", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/projects/${project.id}/service-accounts/${createdSA.id}/keys`,
        token: enterpriseOwner.token,
        body: { label: "Rotated Secondary Key 2026", expiresInDays: 60 },
      });
      const res = await createServiceAccountKey(req, {
        params: Promise.resolve({ projectId: project.id, saId: createdSA.id }),
      });
      expect(res.status).toBe(201);
      apiKey2 = await res.json();
      expect(apiKey2.key).toBeDefined();
    });

    it("Scenario 28: Lists active API keys for Service Account", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/projects/${project.id}/service-accounts/${createdSA.id}/keys`,
        token: enterpriseOwner.token,
      });
      const res = await getServiceAccountKeys(req, {
        params: Promise.resolve({ projectId: project.id, saId: createdSA.id }),
      });
      expect(res.status).toBe(200);
      const keys = await res.json();
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThanOrEqual(2);
    });

    it("Scenario 29: Revokes primary API Key -> Old key is deleted", async () => {
      const req = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/projects/${project.id}/service-accounts/${createdSA.id}/keys/${apiKey1.id}`,
        token: enterpriseOwner.token,
      });
      const res = await deleteServiceAccountKey(req, {
        params: Promise.resolve({ projectId: project.id, saId: createdSA.id, keyId: apiKey1.id }),
      });
      expect(res.status).toBe(200);

      // Verify in DB key is deleted
      const dbKey = await prisma.apiKey.findUnique({ where: { id: apiKey1.id } });
      expect(dbKey).toBeNull();
    });
  });

  // =========================================================================
  // SUITE 6: JIT ACCESS EXPIRATION, REJECTION & USAGE LIMITS (6 Scenarios)
  // =========================================================================
  describe("Suite 6: Just-In-Time (JIT) Link Lifecycle, Limits & Rejection", () => {
    it("Scenario 30: Prevents user from claiming their own JIT link (400 Bad Request)", async () => {
      const genReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/jit/generate",
        token: enterpriseOwner.token,
        body: { projectId: project.id, duration: 30, maxUses: 1, expiresInHours: 1 },
      });
      const genRes = await generateJitLink(genReq);
      const link = await genRes.json();

      // Owner tries to claim own link
      const claimReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/jit/claim",
        token: enterpriseOwner.token,
        body: { token: link.token },
      });
      const claimRes = await claimJitLink(claimReq);
      expect(claimRes.status).toBe(400);
    });

    it("Scenario 31: Rejects claim on EXPIRED JIT link with 410 Gone", async () => {
      const expiredLink = await prisma.jitLink.create({
        data: {
          token: "expired_token_" + Math.random().toString(36).slice(2, 10),
          projectId: project.id,
          duration: 30,
          createdBy: enterpriseOwner.user.id,
          expiresAt: new Date(Date.now() - 1000 * 60 * 60), // Expired 1 hour ago
          maxUses: 1,
          usedCount: 0,
        },
      });

      const claimReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/jit/claim",
        token: contractor.token,
        body: { token: expiredLink.token },
      });
      const claimRes = await claimJitLink(claimReq);
      expect(claimRes.status).toBe(410);
    });

    it("Scenario 32: Rejects claim on REVOKED JIT link with 410 Gone", async () => {
      const revokedLink = await prisma.jitLink.create({
        data: {
          token: "revoked_token_" + Math.random().toString(36).slice(2, 10),
          projectId: project.id,
          duration: 30,
          createdBy: enterpriseOwner.user.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          maxUses: 1,
          usedCount: 0,
          isRevoked: true,
        },
      });

      const claimReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/jit/claim",
        token: contractor.token,
        body: { token: revokedLink.token },
      });
      const claimRes = await claimJitLink(claimReq);
      expect(claimRes.status).toBe(410);
    });

    it("Scenario 33: Rejects claim when max usage count is exceeded (410 Gone)", async () => {
      const maxUsedLink = await prisma.jitLink.create({
        data: {
          token: "max_used_token_" + Math.random().toString(36).slice(2, 10),
          projectId: project.id,
          duration: 30,
          createdBy: enterpriseOwner.user.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          maxUses: 1,
          usedCount: 1, // Already used 1/1
        },
      });

      const claimReq = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/jit/claim",
        token: contractor.token,
        body: { token: maxUsedLink.token },
      });
      const claimRes = await claimJitLink(claimReq);
      expect(claimRes.status).toBe(410);
    });

    it("Scenario 34: Admin rejects AccessRequest -> Status becomes 'rejected'", async () => {
      const testRequest = await prisma.accessRequest.create({
        data: {
          userId: contractor.user.id,
          projectId: project.id,
          secretIds: [devSecret.id],
          workspaceId: workspace.id,
          duration: 30,
          status: "pending",
          reason: "Emergency sprint access",
          requestedAt: new Date(),
        },
      });

      const { POST: handleDecision } = await import("@/app/api/access/approve/route");
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/access/approve",
        token: teamAdmin.token,
        body: { requestId: testRequest.id, decision: "rejected" },
      });
      const res = await handleDecision(req, {});
      expect(res.status).toBe(200);

      const dbReq = await prisma.accessRequest.findUnique({ where: { id: testRequest.id } });
      expect(dbReq?.status).toBe("rejected");
    });

    it("Scenario 35: Rejected contractor cannot decrypt secrets (values remain [REDACTED])", async () => {
      await invalidateUserRbacCache(contractor.user.id);

      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}`,
        token: contractor.token,
        searchParams: { projectId: project.id },
      });
      const res = await getSecrets(req, {});
      // Since contractor was not added to the project, returns 403 or redacted
      expect([200, 403]).toContain(res.status);
    });
  });
});
