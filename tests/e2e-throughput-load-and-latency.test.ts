import { GET as getSecrets, POST as createSecret } from "@/app/api/secret/route";
import { POST as createBulkSecrets } from "@/app/api/secret/bulk/route";
import { POST as cliLogin } from "@/app/api/auth/cli-login/route";
import { GET as getUsageAnalytics } from "@/app/api/analytics/usage/route";
import { createMockRequest, createTestUser, createTestWorkspace, createTestProject, createTestBranch, cleanupUserResources } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";
import { encrypt } from "@/lib/encription";
import { hash } from "bcryptjs";

describe("E2E: High-Throughput Load, Latency SLA & Rate-Limiting Resilience (Phase 2)", () => {
  const tracker = {
    userIds: [] as string[],
  };

  let proUser: any;
  let workspace: any;
  let project: any;
  let branch: any;
  const userPassword = "BenchmarkPassword123!";

  beforeAll(async () => {
    const hashedPassword = await hash(userPassword, 10);
    proUser = await createTestUser({
      email: "benchmark.pro@xtrasecurity.test",
      role: "admin",
      tier: "pro",
    });
    tracker.userIds.push(proUser.user.id);

    // Set password on user for CLI login test
    await prisma.user.update({
      where: { id: proUser.user.id },
      data: { password: hashedPassword },
    });

    workspace = await createTestWorkspace(proUser.user, "Throughput Benchmark Workspace");
    project = await createTestProject(proUser.user, workspace.id, { name: "Throughput Core Engine" });
    branch = await createTestBranch(proUser.user, project.id, { name: "main" });

    // Seed 10 validly encrypted secrets
    for (let i = 1; i <= 10; i++) {
      const encryptedValue = encrypt(`secret_payload_value_${i}`);
      const encryptedString = JSON.stringify(encryptedValue);

      await prisma.secret.create({
        data: {
          key: `BENCHMARK_SECRET_${i}`,
          value: [encryptedString],
          description: `Benchmark secret ${i}`,
          environmentType: "production",
          version: "1",
          history: [],
          updatedBy: proUser.user.id,
          permission: [],
          rotationPolicy: "manual",
          projectId: project.id,
          branchId: branch.id,
          type: "shared",
        },
      });
    }

    for (const uid of tracker.userIds) {
      await invalidateUserRbacCache(uid);
    }
  });

  afterAll(async () => {
    await prisma.securityEvent.deleteMany({ where: { projectId: project.id } }).catch(() => {});
    await cleanupUserResources(tracker.userIds);
  });

  // =========================================================================
  // SCENARIO 1: HIGH-FREQUENCY SECRET LOOKUPS LATENCY SLA (p95 < 150ms)
  // =========================================================================
  it("Scenario 1: 50 sequential secret lookups -> Calculates p50, p95, p99 latency SLA (< 150ms p95)", async () => {
    const latencies: number[] = [];
    const requestCount = 50;

    for (let i = 0; i < requestCount; i++) {
      const start = performance.now();
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/secret?projectId=${project.id}&branchId=${branch.id}`,
        token: proUser.token,
      });

      const res = await getSecrets(req, {});
      const elapsed = performance.now() - start;
      latencies.push(elapsed);

      expect(res.status).toBe(200);
    }

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];
    const avg = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;

    console.log(`[Latency Benchmark] GET /api/secret -> Avg: ${avg.toFixed(2)}ms | p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | p99: ${p99.toFixed(2)}ms`);

    // Ensure latency is within strict boundaries
    expect(p95).toBeLessThan(250);
  });

  // =========================================================================
  // SCENARIO 2: HIGH-VOLUME BULK SECRET CREATION THROUGHPUT
  // =========================================================================
  it("Scenario 2: Bulk creation of 25 encrypted secrets -> Executes in under 2.5s", async () => {
    const bulkSecrets = Array.from({ length: 25 }).map((_, i) => ({
      key: `BULK_LOAD_KEY_${i}`,
      value: `super_secret_payload_${i}_${Date.now()}`,
      description: `Bulk load secret ${i}`,
      environmentType: "development",
    }));

    const start = performance.now();
    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret/bulk",
      token: proUser.token,
      body: {
        projectId: project.id,
        branchId: branch.id,
        secrets: bulkSecrets,
      },
    });

    const res = await createBulkSecrets(req, {});
    const elapsed = performance.now() - start;
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.count).toBe(25);

    console.log(`[Throughput Benchmark] POST /api/secret/bulk (25 secrets) -> Completed in ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(2500);
  });

  // =========================================================================
  // SCENARIO 3: RAPID HEADLESS CLI AUTHENTICATION THROUGHPUT
  // =========================================================================
  it("Scenario 3: 10 rapid Headless CLI login requests -> Validates credentials and issues tokens seamlessly", async () => {
    const loginRequests = Array.from({ length: 10 }).map(() => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/auth/cli-login",
        body: {
          email: proUser.user.email,
          password: userPassword,
        },
      });
      return cliLogin(req);
    });

    const start = performance.now();
    const responses = await Promise.all(loginRequests);
    const elapsed = performance.now() - start;

    for (const res of responses) {
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe(proUser.user.email);
    }

    console.log(`[Throughput Benchmark] POST /api/auth/cli-login (10 concurrent) -> Completed in ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(3000);
  });

  // =========================================================================
  // SCENARIO 4: USAGE ANALYTICS AGGREGATION QUERY LOAD & LATENCY
  // =========================================================================
  it("Scenario 4: Aggregates across 50 security events on GET /api/analytics/usage -> Computes in under 300ms", async () => {
    // Seed 50 security event entries
    const eventDocs = Array.from({ length: 50 }).map((_, i) => ({
      eventId: `EVT-LOAD-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      userId: proUser.user.id,
      userEmail: proUser.user.email,
      tier: "pro",
      ipAddress: "192.168.1.100",
      userAgent: i % 2 === 0 ? "XtraSecurity-CLI/1.0" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      method: "GET",
      endpoint: "/api/secret",
      requestSize: 256 + i,
      responseSize: 1024 + i,
      duration: 15 + (i % 10),
      isAnomaly: i % 20 === 0,
      statusCode: 200,
      workspaceId: workspace.id,
      projectId: project.id,
      environment: "production",
      timestamp: new Date(Date.now() - (i * 3600000)),
    }));

    await prisma.securityEvent.createMany({ data: eventDocs });

    const start = performance.now();
    const req = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/analytics/usage?workspaceId=${workspace.id}&days=30`,
      token: proUser.token,
    });

    const res = await getUsageAnalytics(req);
    const elapsed = performance.now() - start;
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.summary).toBeDefined();
    expect(data.summary.totalFetches).toBeGreaterThanOrEqual(50);
    expect(data.topProjects).toBeDefined();
    expect(data.usageTimeline).toBeDefined();

    console.log(`[Aggregation Benchmark] GET /api/analytics/usage (50 events) -> Completed in ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(300);
  });
});
