import { GET as getAuditLogs } from "@/app/api/audit/route";
import { GET as getAuditDashboard } from "@/app/api/audit/dashboard/route";
import { GET as getComplianceReport } from "@/app/api/compliance/report/route";
import { createMockRequest, createTestUser, createTestWorkspace, createTestProject, cleanupTestData } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";

describe("E2E: Audit Trails & Security Health Reporting", () => {
  const tracker: {
    userIds: string[];
    workspaceIds: string[];
    projectIds: string[];
  } = {
    userIds: [],
    workspaceIds: [],
    projectIds: [],
  };

  afterAll(async () => {
    await cleanupTestData(tracker);
  });

  it("should write audit log and verify zero credential leakage in GET /api/audit", async () => {
    const { user, token } = await createTestUser({ role: "owner" });
    tracker.userIds.push(user.id);

    const workspace = await createTestWorkspace(user, "Audit Test Workspace");
    tracker.workspaceIds.push(workspace.id);

    const project = await createTestProject(user, workspace.id, { name: "Audit Target Project" });
    tracker.projectIds.push(project.id);

    // 1. Write an audit log entry
    await logAudit(
      "SECRET_CREATED",
      user.id,
      "sec_test_id_999",
      { key: "API_GATEWAY_KEY", environment: "production" },
      workspace.id
    );

    // 2. Fetch audit logs via GET /api/audit
    const req = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/audit?workspaceId=${workspace.id}`,
      token,
      searchParams: { workspaceId: workspace.id },
    });

    const res = await getAuditLogs(req);
    expect(res.status).toBe(200);

    const resData = await res.json();
    expect(resData.data).toBeDefined();
    expect(Array.isArray(resData.data)).toBe(true);
    expect(resData.data.length).toBeGreaterThan(0);

    const targetLog = resData.data.find((l: any) => l.action === "SECRET_CREATED");
    expect(targetLog).toBeDefined();
    expect(targetLog.user).toBeDefined();
    expect(targetLog.user.email).toBe(user.email);

    // CRITICAL SECURITY ASSERTION: Verify user object has NO password, mfaSecret, or backup codes
    expect(targetLog.user.password).toBeUndefined();
    expect(targetLog.user.mfaSecret).toBeUndefined();
    expect(targetLog.user.mfaBackupCodes).toBeUndefined();
    expect(targetLog.user.emailOtp).toBeUndefined();
  });

  it("should retrieve audit dashboard metrics and anomalies without leaking credentials", async () => {
    const { user, token } = await createTestUser({ role: "owner" });
    tracker.userIds.push(user.id);

    const workspace = await createTestWorkspace(user, "Dashboard Workspace");
    tracker.workspaceIds.push(workspace.id);

    const project = await createTestProject(user, workspace.id, { name: "Dashboard Project" });
    tracker.projectIds.push(project.id);

    // Write audit entries
    await logAudit("SECRET_ROTATED", user.id, "sec_1", { key: "PROD_DB" }, workspace.id);
    await logAudit("PROJECT_IP_ADDED", user.id, project.id, { ip: "1.2.3.4" }, workspace.id);

    const req = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/audit/dashboard?workspaceId=${workspace.id}`,
      token,
      searchParams: { workspaceId: workspace.id },
    });

    const res = await getAuditDashboard(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.stats).toBeDefined();
    expect(data.stats.totalEvents).toBeGreaterThanOrEqual(2);
    expect(data.anomalies).toBeDefined();
    expect(Array.isArray(data.anomalies)).toBe(true);

    // Check that anomalies user field is sanitized
    for (const anomaly of data.anomalies) {
      if (anomaly.user) {
        expect(anomaly.user.password).toBeUndefined();
        expect(anomaly.user.mfaSecret).toBeUndefined();
      }
    }
  });

  it("should generate a SOC2 & compliance report for the workspace", async () => {
    const { user, token } = await createTestUser({ role: "owner", mfaEnabled: true });
    tracker.userIds.push(user.id);

    const workspace = await createTestWorkspace(user, "Compliance Workspace");
    tracker.workspaceIds.push(workspace.id);

    const project = await createTestProject(user, workspace.id, { name: "Compliance Project" });
    tracker.projectIds.push(project.id);

    const req = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/compliance/report?workspaceId=${workspace.id}`,
      token,
      searchParams: { workspaceId: workspace.id },
    });

    const res = await getComplianceReport(req);
    expect(res.status).toBe(200);

    const report = await res.json();
    expect(report.generatedAt).toBeDefined();
    expect(report.generatedBy).toBe(user.email);
    expect(report.summary).toBeDefined();
    expect(typeof report.summary.totalProjects).toBe("number");
    expect(typeof report.summary.totalSecrets).toBe("number");
    expect(typeof report.summary.totalAuditEntries).toBe("number");
    expect(report.generatedByMfaEnabled).toBe(true);
  });
});
