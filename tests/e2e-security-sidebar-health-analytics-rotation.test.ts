import { GET as getSecurityHealth } from "@/app/api/secret/health/route";
import { GET as getUsageAnalytics } from "@/app/api/analytics/usage/route";
import { GET as getRotationSchedules, POST as createRotationSchedule } from "@/app/api/rotation/schedules/route";
import { POST as runRotation } from "@/app/api/rotation/run/route";
import { GET as getRotationHistory } from "@/app/api/rotation/history/route";
import { POST as createSecret } from "@/app/api/secret/route";
import { provisionAllTestUsers, SeededUser } from "./helpers/seed-users";
import { createMockRequest, cleanupUserResources, createTestWorkspace, createTestProject } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";

describe("E2E Security Sidebar: Security Health, Usage Analytics & Secret Rotation", () => {
  let userMap: Record<string, { user: any; token: string; credentials: SeededUser }>;

  let enterpriseOwner: { user: any; token: string; credentials: SeededUser };
  let devSenior: { user: any; token: string; credentials: SeededUser };
  let auditor: { user: any; token: string; credentials: SeededUser };

  let workspace: any;
  let project1: any;
  let project2: any;
  let secret1: any;
  let secret2: any;

  beforeAll(async () => {
    userMap = await provisionAllTestUsers();

    enterpriseOwner = userMap["owner.enterprise@xtrasecurity.test"];
    devSenior = userMap["dev.senior@xtrasecurity.test"];
    auditor = userMap["auditor.viewer@xtrasecurity.test"];

    const allUserIds = Object.values(userMap).map((u) => u.user.id);
    await cleanupUserResources(allUserIds);

    // 1. Setup Workspace & Projects
    workspace = await createTestWorkspace(enterpriseOwner.user, "Security Overview Workspace");
    project1 = await createTestProject(enterpriseOwner.user, workspace.id, { name: "MainServer(QuickCommerce)" });
    project2 = await createTestProject(enterpriseOwner.user, workspace.id, { name: "PaymentGateway" });

    // 2. Setup Team & Members
    const team = await prisma.team.create({
      data: {
        name: "Security Engineering",
        description: "SecOps Team",
        teamColor: "#059669",
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

    await prisma.teamProject.createMany({
      data: [
        { teamId: team.id, projectId: project1.id },
        { teamId: team.id, projectId: project2.id },
      ],
    });

    // 3. Branches
    const branches1 = await prisma.branch.findMany({ where: { projectId: project1.id } });
    const mainBranch1 = branches1.find((b) => b.name === "main") || branches1[0] || (await prisma.branch.create({
      data: { name: "main", description: "Main branch", createdBy: enterpriseOwner.user.id, projectId: project1.id, versionNo: "1" }
    }));

    const branches2 = await prisma.branch.findMany({ where: { projectId: project2.id } });
    const mainBranch2 = branches2.find((b) => b.name === "main") || branches2[0] || (await prisma.branch.create({
      data: { name: "main", description: "Main branch", createdBy: enterpriseOwner.user.id, projectId: project2.id, versionNo: "1" }
    }));

    // 4. Create Secrets (simulate duplicate key across project1 and project2)
    const reqSecret1 = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token: enterpriseOwner.token,
      body: {
        key: "DATABASE_URL",
        value: "postgres://db1.internal:5432/commerce",
        projectId: project1.id,
        branchId: mainBranch1.id,
        environmentType: "production",
      },
    });
    const resSecret1 = await createSecret(reqSecret1, {});
    secret1 = await resSecret1.json();

    const reqSecret2 = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token: enterpriseOwner.token,
      body: {
        key: "DATABASE_URL",
        value: "postgres://db2.internal:5432/payments",
        projectId: project2.id,
        branchId: mainBranch2.id,
        environmentType: "production",
      },
    });
    const resSecret2 = await createSecret(reqSecret2, {});
    secret2 = await resSecret2.json();

    // 5. Create simulated security events for Usage Analytics
    await prisma.securityEvent.createMany({
      data: [
        {
          eventId: `evt-cli-${Date.now()}-1`,
          method: "GET",
          endpoint: "/api/secret",
          statusCode: 200,
          duration: 38,
          workspaceId: workspace.id,
          projectId: project1.id,
          userId: devSenior.user.id,
          userEmail: devSenior.credentials.email,
          ipAddress: "192.168.1.50",
          userAgent: "xtra-cli/1.2.0 (linux-x64)",
          timestamp: new Date(),
        },
        {
          eventId: `evt-ui-${Date.now()}-2`,
          method: "GET",
          endpoint: "/api/secret",
          statusCode: 200,
          duration: 42,
          workspaceId: workspace.id,
          projectId: project1.id,
          userId: enterpriseOwner.user.id,
          userEmail: enterpriseOwner.credentials.email,
          ipAddress: "192.168.1.10",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          timestamp: new Date(),
        },
      ],
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
  // 1. SECURITY HEALTH (Screenshot 1)
  // =========================================================================
  describe("1. Security Health Posture API (GET /api/secret/health)", () => {
    it("GET /api/secret/health - Returns workspace posture metrics and duplicate key detection", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret/health?workspaceId=${workspace.id}`,
        token: enterpriseOwner.token,
      });

      const res = await getSecurityHealth(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.total).toBeGreaterThanOrEqual(2);
      expect(data.securityScore).toBeDefined();
      expect(typeof data.securityScore).toBe("number");
      expect(data.duplicateCount).toBeGreaterThanOrEqual(1); // 'DATABASE_URL' duplicated across project 1 & 2
      expect(Array.isArray(data.criticalFixes)).toBe(true);
    });

    it("SECURITY: Rejects user not belonging to workspace (403 Forbidden)", async () => {
      const attacker = userMap["attacker@blackhat.test"];
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret/health?workspaceId=${workspace.id}`,
        token: attacker.token,
      });

      const res = await getSecurityHealth(req);
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 2. USAGE ANALYTICS (Screenshot 2)
  // =========================================================================
  describe("2. Usage Analytics API (GET /api/analytics/usage)", () => {
    it("GET /api/analytics/usage - Computes fetch volume, automated CLI vs human ratio & timeline", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/analytics/usage?workspaceId=${workspace.id}&days=30`,
        token: enterpriseOwner.token,
      });

      const res = await getUsageAnalytics(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.summary).toBeDefined();
      expect(data.summary.totalFetches).toBeGreaterThanOrEqual(2);
      expect(typeof data.summary.saFetches).toBe("number");
      expect(typeof data.summary.humanFetches).toBe("number");
      expect(Array.isArray(data.usageTimeline)).toBe(true);
      expect(data.usageTimeline.length).toBe(30);
    });
  });

  // =========================================================================
  // 3. SECRET ROTATION: SCHEDULES, MANUAL RUN & HISTORY (Screenshots 3 & 4)
  // =========================================================================
  describe("3. Secret Rotation Lifecycle (Screenshots 3 & 4)", () => {
    let rotationScheduleId: string;

    it("POST /api/rotation/schedules - Creates automated rotation schedule", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/rotation/schedules",
        token: enterpriseOwner.token,
        body: {
          secretId: secret1.id,
          frequency: "daily",
          strategy: "auto-generate",
          method: "auto-generate",
          projectId: project1.id,
          enabled: true,
        },
      });

      const res = await createRotationSchedule(req);
      expect([200, 201]).toContain(res.status);
      const data = await res.json();

      expect(data.id).toBeDefined();
      expect(data.secretId).toBe(secret1.id);
      expect(data.frequency).toBe("daily");
      expect(data.enabled).toBe(true);
      rotationScheduleId = data.id;
    });

    it("GET /api/rotation/schedules - Lists active and overdue schedules for workspace", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/rotation/schedules?workspaceId=${workspace.id}`,
        token: devSenior.token,
      });

      const res = await getRotationSchedules(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.some((s: any) => s.id === rotationScheduleId)).toBe(true);
    });

    it("POST /api/rotation/run - Triggers manual 'Rotate Now' action and records history", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/rotation/run",
        token: devSenior.token,
        body: { scheduleId: rotationScheduleId },
      });

      const res = await runRotation(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify secret version incremented in DB
      const updatedSecret = await prisma.secret.findUnique({ where: { id: secret1.id } });
      expect(parseInt(updatedSecret?.version || "0", 10)).toBeGreaterThan(1);
    });

    it("GET /api/rotation/history - Retrieves rotation audit history logs", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/rotation/history?workspaceId=${workspace.id}`,
        token: enterpriseOwner.token,
      });

      const res = await getRotationHistory(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data[0].status).toBe("success");
    });

    it("SECURITY: Rejects Viewer role from executing 'Rotate Now' (403 Forbidden)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/rotation/run",
        token: auditor.token,
        body: { scheduleId: rotationScheduleId },
      });

      const res = await runRotation(req);
      expect(res.status).toBe(403);
    });
  });
});
