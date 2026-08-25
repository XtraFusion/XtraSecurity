import { POST as initMfaSetup, PUT as verifyMfaEnable, DELETE as disableMfa } from "@/app/api/mfa/setup/route";
import { GET as getMfaStatus } from "@/app/api/mfa/status/route";
import { GET as runRevokeExpiredCron } from "@/app/api/cron/revoke-expired-access/route";
import { GET as runRotateCron } from "@/app/api/cron/rotate/route";
import { provisionAllTestUsers, SeededUser } from "./helpers/seed-users";
import { createMockRequest, cleanupUserResources, createTestWorkspace, createTestProject } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { generateTotpToken } from "@/lib/mfa";
import { decrypt } from "@/lib/encription";

describe("E2E Multi-Factor Authentication (MFA) & Automated Cron Execution", () => {
  let userMap: Record<string, { user: any; token: string; credentials: SeededUser }>;
  let devSenior: { user: any; token: string };
  let enterpriseOwner: { user: any; token: string };

  let workspace: any;
  let project: any;

  beforeAll(async () => {
    userMap = await provisionAllTestUsers();
    devSenior = userMap["dev.senior@xtrasecurity.test"];
    enterpriseOwner = userMap["owner.enterprise@xtrasecurity.test"];

    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);

    workspace = await createTestWorkspace(enterpriseOwner.user, "Automation & MFA Workspace");
    project = await createTestProject(enterpriseOwner.user, workspace.id, { name: "Automation Core Project" });

    // Reset MFA on devSenior
    await prisma.user.update({
      where: { id: devSenior.user.id },
      data: { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [] },
    });
  });

  afterAll(async () => {
    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);
  });

  // =========================================================================
  // 1. MFA LIFECYCLE (SETUP, VERIFY, STATUS, DISABLE)
  // =========================================================================
  describe("1. Multi-Factor Authentication (MFA) Flow", () => {
    let totpSecret: string;

    it("POST /api/mfa/setup - Generates QR code and temporary encrypted secret", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/mfa/setup",
        token: devSenior.token,
      });

      const res = await initMfaSetup(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.qrCode).toBeDefined();
      expect(data.secret).toBeDefined();
      totpSecret = data.secret;

      const userDb = await prisma.user.findUnique({ where: { id: devSenior.user.id } });
      expect(userDb?.mfaEnabled).toBe(false);
      expect(userDb?.mfaSecret).toBeDefined();
    });

    it("PUT /api/mfa/setup - Rejects invalid 6-digit TOTP code (400 Bad Request)", async () => {
      const req = createMockRequest({
        method: "PUT",
        url: "http://localhost:3000/api/mfa/setup",
        token: devSenior.token,
        body: { token: "000000" },
      });

      const res = await verifyMfaEnable(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid verification code");
    });

    it("PUT /api/mfa/setup - Enables MFA with valid TOTP code and generates backup codes", async () => {
      const validToken = await generateTotpToken(totpSecret);
      const req = createMockRequest({
        method: "PUT",
        url: "http://localhost:3000/api/mfa/setup",
        token: devSenior.token,
        body: { token: validToken },
      });

      const res = await verifyMfaEnable(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.backupCodes).toBeDefined();
      expect(Array.isArray(data.backupCodes)).toBe(true);
      expect(data.backupCodes.length).toBeGreaterThan(0);

      const userDb = await prisma.user.findUnique({ where: { id: devSenior.user.id } });
      expect(userDb?.mfaEnabled).toBe(true);
      expect(userDb?.mfaBackupCodes.length).toBeGreaterThan(0);
    });

    it("GET /api/mfa/status - Reports mfaEnabled: true", async () => {
      const req = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/mfa/status",
        token: devSenior.token,
      });

      const res = await getMfaStatus(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.mfaEnabled).toBe(true);
    });

    it("DELETE /api/mfa/setup - Disables MFA with valid TOTP token", async () => {
      const validToken = await generateTotpToken(totpSecret);
      const req = createMockRequest({
        method: "DELETE",
        url: "http://localhost:3000/api/mfa/setup",
        token: devSenior.token,
        body: { token: validToken },
      });

      const res = await disableMfa(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const userDb = await prisma.user.findUnique({ where: { id: devSenior.user.id } });
      expect(userDb?.mfaEnabled).toBe(false);
      expect(userDb?.mfaSecret).toBeNull();
    });
  });

  // =========================================================================
  // 2. AUTOMATED CRON WORKERS
  // =========================================================================
  describe("2. Background Cron Automation & Expiration Engine", () => {
    const CRON_SECRET = process.env.CRON_SECRET || "test-cron-secret-12345";

    beforeAll(() => {
      process.env.CRON_SECRET = CRON_SECRET;
    });

    it("SECURITY: Rejects cron execution without valid authorization header (401)", async () => {
      const req = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/cron/revoke-expired-access",
      });

      const res = await runRevokeExpiredCron(req);
      expect(res.status).toBe(401);
    });

    it("GET /api/cron/revoke-expired-access - Automatically revokes expired JIT requests", async () => {
      // Create an expired access request in DB
      const expiredPastDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago
      const accessRequest = await prisma.accessRequest.create({
        data: {
          userId: devSenior.user.id,
          projectId: project.id,
          status: "approved",
          reason: "Emergency DB fix",
          duration: 60,
          expiresAt: expiredPastDate,
          secretIds: [],
        },
      });

      const req = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/cron/revoke-expired-access",
        headers: {
          authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      const res = await runRevokeExpiredCron(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.processed).toBeGreaterThanOrEqual(1);

      // Verify DB status updated to 'expired'
      const updatedRequest = await prisma.accessRequest.findUnique({
        where: { id: accessRequest.id },
      });
      expect(updatedRequest?.status).toBe("expired");

      // Verify audit log generated
      const auditLogs = await prisma.auditLog.findMany({
        where: { action: "JIT_ACCESS_EXPIRED", entityId: project.id },
      });
      expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    });

    it("GET /api/cron/rotate - Executes rotation check worker with CRON_SECRET", async () => {
      const req = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/cron/rotate",
        headers: {
          authorization: `Bearer ${CRON_SECRET}`,
        },
      });

      const res = await runRotateCron(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toBeDefined();
    });
  });
});
