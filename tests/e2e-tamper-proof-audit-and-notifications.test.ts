import { GET as getNotifications, PATCH as updateNotification, DELETE as deleteNotification } from "@/app/api/notifications/route";
import { GET as getAuditLogs } from "@/app/api/audit/route";
import { POST as createSecret, PUT as updateSecret } from "@/app/api/secret/route";
import { POST as rollbackSecret } from "@/app/api/secret/rollback/route";
import { POST as addProjectIp } from "@/app/api/project/[id]/ip/route";
import { provisionAllTestUsers, SeededUser } from "./helpers/seed-users";
import { createMockRequest, cleanupUserResources, createTestWorkspace, createTestProject, createTestBranch, createTestTeam } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { logAudit, createTamperEvidentLog, verifyAuditChain } from "@/lib/audit";
import { invalidateUserRbacCache } from "@/lib/permissions";

describe("E2E Tamper-Proof Audit Logging & Real-Time Notification Tracking", () => {
  let userMap: Record<string, { user: any; token: string; credentials: SeededUser }>;

  let enterpriseOwner: { user: any; token: string };
  let teamAdmin: { user: any; token: string };
  let devSenior: { user: any; token: string };
  let attacker: { user: any; token: string };

  let workspace: any;
  let project: any;
  let branch: any;

  beforeAll(async () => {
    userMap = await provisionAllTestUsers();

    enterpriseOwner = userMap["owner.enterprise@xtrasecurity.test"];
    teamAdmin = userMap["admin.team@xtrasecurity.test"];
    devSenior = userMap["dev.senior@xtrasecurity.test"];
    attacker = userMap["attacker@blackhat.test"];

    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);

    // Clean up audit logs and notifications for test consistency
    await prisma.auditLog.deleteMany({});
    await prisma.notification.deleteMany({});

    // Setup Workspace & Project
    workspace = await createTestWorkspace(enterpriseOwner.user, "Audit Verification Workspace");
    project = await createTestProject(enterpriseOwner.user, workspace.id, { name: "Audit Core Engine" });
    branch = await createTestBranch(enterpriseOwner.user, project.id, { name: "main" });

    // Add developer to team
    const team = await createTestTeam(enterpriseOwner.user, workspace.id, { name: "Audit SecOps Team" });
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
  // 1. AUDIT LOG GENERATION & LIFECYCLE TRACKING
  // =========================================================================
  describe("1. Audit Log Generation & Entity Tracking", () => {
    let createdSecretId: string;

    it("Generates tamper-evident audit log when secret is created", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret",
        token: devSenior.token,
        body: {
          key: "AUDIT_TRACKED_SECRET_KEY",
          value: "super_secret_payload_value_123",
          environmentType: "development",
          projectId: project.id,
        },
      });
      const res = await createSecret(req, {});
      expect(res.status).toBe(201);
      const secret = await res.json();
      createdSecretId = secret.id;

      // Verify audit log exists
      const logs = await prisma.auditLog.findMany({
        where: { action: { in: ["SECRET_CREATE", "SECRET_CREATED"] } },
      });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.currentHash).toBeDefined();
      expect(lastLog.previousHash).toBeDefined();
    });

    it("Generates tamper-evident audit log when secret is updated (v1 -> v2)", async () => {
      const req = createMockRequest({
        method: "PUT",
        url: `http://localhost:3000/api/secret?id=${createdSecretId}`,
        token: devSenior.token,
        searchParams: { id: createdSecretId },
        body: {
          id: createdSecretId,
          value: "updated_payload_v2",
          description: "Rotated development secret",
        },
      });
      const res = await updateSecret(req, {});
      expect(res.status).toBe(200);

      const updateLogs = await prisma.auditLog.findMany({
        where: { action: { in: ["SECRET_UPDATE", "SECRET_UPDATED"] } },
      });
      expect(updateLogs.length).toBeGreaterThanOrEqual(1);
    });

    it("Generates tamper-evident audit log when secret is rolled back (v2 -> v3)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/secret/rollback",
        token: devSenior.token,
        body: {
          secretId: createdSecretId,
          targetVersion: "1",
          changeReason: "Rollback to stable v1",
        },
      });
      const res = await rollbackSecret(req);
      expect(res.status).toBe(200);

      const rollbackLogs = await prisma.auditLog.findMany({
        where: { action: { in: ["SECRET_ROLLBACK", "SECRET_ROLLEDBACK", "secret_rollback"] } },
      });
      expect(rollbackLogs.length).toBeGreaterThanOrEqual(1);
    });

    it("Generates tamper-evident audit log when IP restriction is added", async () => {
      const req = createMockRequest({
        method: "POST",
        url: `http://localhost:3000/api/project/${project.id}/ip`,
        token: enterpriseOwner.token,
        body: { ip: "192.0.2.77", description: "Audit Test Bastion" },
      });
      const res = await addProjectIp(req, { params: Promise.resolve({ id: project.id }) });
      expect(res.status).toBe(200);

      const ipLogs = await prisma.auditLog.findMany({
        where: { action: { in: ["PROJECT_IP_ADDED", "IP_RESTRICTION_ADDED", "IP_ADDED"] } },
      });
      expect(ipLogs.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 2. ZERO-LEAKAGE VERIFICATION ACROSS AUDIT TRAIL
  // =========================================================================
  describe("2. Zero-Leakage & Sanitization in Audit Trail", () => {
    it("Verifies GET /api/audit exposes ZERO passwords, TOTP secrets or master keys", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/audit?workspaceId=${workspace.id}`,
        token: enterpriseOwner.token,
        searchParams: { workspaceId: workspace.id },
      });
      const res = await getAuditLogs(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.data)).toBe(true);

      for (const log of data.data) {
        // User metadata checks
        expect(log.user?.password).toBeUndefined();
        expect(log.user?.mfaSecret).toBeUndefined();

        // Changes payload checks
        const changesStr = JSON.stringify(log.changes || {});
        expect(changesStr).not.toContain("super_secret_payload_value_123");
        expect(changesStr).not.toContain("Password123!");
      }
    });
  });

  // =========================================================================
  // 3. CRYPTOGRAPHIC SHA-256 HASH CHAINING & TAMPER DETECTION
  // =========================================================================
  describe("3. SHA-256 Cryptographic Hash Chaining & Tamper Detection", () => {
    it("Verifies continuous, unbroken SHA-256 hash chain across all audit records", async () => {
      const verification = await verifyAuditChain();
      expect(verification.valid).toBe(true);
    });

    it("TAMPER SIMULATION: Modifying historical audit record in DB is IMMEDIATELY DETECTED", async () => {
      // 1. Fetch any existing audit log
      const targetLog = await prisma.auditLog.findFirst({
        orderBy: { timestamp: "asc" },
      });
      expect(targetLog).not.toBeNull();

      const originalAction = targetLog!.action;

      // 2. Tamper: Alter the action field directly in the database
      await prisma.auditLog.update({
        where: { id: targetLog!.id },
        data: { action: "MALICIOUSLY_ALTERED_ACTION" },
      });

      // 3. Run cryptographic hash verification -> MUST FAIL
      const tamperedCheck = await verifyAuditChain();
      expect(tamperedCheck.valid).toBe(false);
      expect(tamperedCheck.brokenAtId).toBe(targetLog!.id);
      expect(tamperedCheck.reason).toContain("Hash verification failed");

      // 4. Restore original action -> Hash chain becomes valid again
      await prisma.auditLog.update({
        where: { id: targetLog!.id },
        data: { action: originalAction },
      });

      const restoredCheck = await verifyAuditChain();
      expect(restoredCheck.valid).toBe(true);
    });

    it("TAMPER SIMULATION: Deleting a middle record breaks the chain link (previousHash mismatch)", async () => {
      // Create 3 dedicated sequential test logs
      const log1 = await createTamperEvidentLog({
        action: "TEST_CHAIN_1",
        userId: enterpriseOwner.user.id,
        entity: "project",
        entityId: project.id,
        changes: { step: 1 },
      });

      const log2 = await createTamperEvidentLog({
        action: "TEST_CHAIN_2",
        userId: enterpriseOwner.user.id,
        entity: "project",
        entityId: project.id,
        changes: { step: 2 },
      });

      const log3 = await createTamperEvidentLog({
        action: "TEST_CHAIN_3",
        userId: enterpriseOwner.user.id,
        entity: "project",
        entityId: project.id,
        changes: { step: 3 },
      });

      // Verify chain is valid before tampering
      const checkBefore = await verifyAuditChain();
      expect(checkBefore.valid).toBe(true);

      // Maliciously delete log2 (the middle link)
      await prisma.auditLog.delete({ where: { id: log2.id } });

      // Run verification -> MUST DETECT PREVIOUS HASH MISMATCH AT log3
      const checkAfter = await verifyAuditChain();
      expect(checkAfter.valid).toBe(false);
      expect(checkAfter.brokenAtId).toBe(log3.id);
      expect(checkAfter.reason).toContain("Previous hash mismatch");

      // Clean up test records
      await prisma.auditLog.deleteMany({
        where: { id: { in: [log1.id, log3.id] } },
      });
    });
  });

  // =========================================================================
  // 4. NOTIFICATION LIFECYCLE & TRACKING
  // =========================================================================
  describe("4. Notification Tracking & Lifecycle State Transitions", () => {
    let testNotification: any;

    beforeAll(async () => {
      testNotification = await prisma.notification.create({
        data: {
          userId: devSenior.user.id,
          userEmail: devSenior.user.email,
          taskTitle: "Secret Version Rollback Alert",
          description: "A secret in your project was restored to v1",
          message: "Rollback performed by SecOps Admin",
          status: "unread",
          read: false,
          workspaceId: workspace.id,
        },
      });
    });

    it("Fetches user notifications and confirms unread state (read: false)", async () => {
      const req = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/notifications",
        token: devSenior.token,
      });
      const res = await getNotifications(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      const notif = data.notifications.find((n: any) => n.id === testNotification.id);
      expect(notif).toBeDefined();
      expect(notif.read).toBe(false);
    });

    it("Updates notification state to read: true via PATCH /api/notifications", async () => {
      const req = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/notifications",
        token: devSenior.token,
        body: { id: testNotification.id, read: true },
      });
      const res = await updateNotification(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.notification.read).toBe(true);

      // Verify in DB directly
      const dbNotif = await prisma.notification.findUnique({ where: { id: testNotification.id } });
      expect(dbNotif?.read).toBe(true);
    });

    it("SECURITY: Other user CANNOT modify victim's notification (403 Forbidden)", async () => {
      const req = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/notifications",
        token: attacker.token,
        body: { id: testNotification.id, read: false },
      });
      const res = await updateNotification(req);
      expect(res.status).toBe(403);
    });

    it("Deletes notification via DELETE /api/notifications", async () => {
      const req = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/notifications?id=${testNotification.id}`,
        token: devSenior.token,
        searchParams: { id: testNotification.id },
      });
      const res = await deleteNotification(req);
      expect(res.status).toBe(200);

      const dbNotif = await prisma.notification.findUnique({ where: { id: testNotification.id } });
      expect(dbNotif).toBeNull();
    });
  });
});
