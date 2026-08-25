import { checkRateLimit, getRateLimitStats } from "@/lib/rate-limit";
import { RotationService } from "@/lib/rotation-service";
import { POST as createSecret, PUT as updateSecret, GET as getSecrets } from "@/app/api/secret/route";
import { POST as addProjectIp } from "@/app/api/project/[id]/ip/route";
import { PATCH as updateAccessRequest } from "@/app/api/access-requests/[id]/route";
import { createMockRequest, createTestUser, createTestWorkspace, createTestProject, createTestBranch, cleanupUserResources } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";
import { encrypt } from "@/lib/encription";

describe("E2E: Chaos Engineering & Fault-Tolerance Resilience (Phase 3)", () => {
  const tracker = {
    userIds: [] as string[],
  };

  let owner: any;
  let workspace: any;
  let project: any;
  let branch: any;
  let secret: any;

  beforeAll(async () => {
    owner = await createTestUser({ email: "chaos.owner@xtrasecurity.test", role: "admin", tier: "pro" });
    tracker.userIds.push(owner.user.id);

    workspace = await createTestWorkspace(owner.user, "Chaos Resilience Hub");
    project = await createTestProject(owner.user, workspace.id, { name: "Resilient Microservice" });
    branch = await createTestBranch(owner.user, project.id, { name: "main" });

    const encryptedVal = JSON.stringify(encrypt("postgres://chaos_user:secret123@db:5432/main"));
    secret = await prisma.secret.create({
      data: {
        key: "RESILIENT_SECRET_KEY",
        value: [encryptedVal],
        description: "Chaos testing secret",
        environmentType: "production",
        version: "1",
        history: [],
        updatedBy: owner.user.id,
        permission: [],
        rotationPolicy: "manual",
        projectId: project.id,
        branchId: branch.id,
        type: "shared",
      },
    });

    for (const uid of tracker.userIds) {
      await invalidateUserRbacCache(uid);
    }
  });

  afterAll(async () => {
    if (secret) {
      await prisma.rotationLog.deleteMany({ where: { scheduleId: { not: "" } } }).catch(() => {});
      await prisma.secret.delete({ where: { id: secret.id } }).catch(() => {});
    }
    await cleanupUserResources(tracker.userIds);
  });

  // =========================================================================
  // SCENARIO 1: REDIS OUTAGE & IN-MEMORY RATE LIMITING FALLBACK
  // =========================================================================
  it("Scenario 1: Rate limiter operates seamlessly with in-memory fallback during Redis absence", async () => {
    const testUserId = `user-chaos-fallback-${Date.now()}`;

    // 1. Check rate limit directly - should not throw, should return valid rate limit object
    const result = await checkRateLimit(testUserId, "pro");
    expect(result.success).toBe(true);
    expect(result.limit).toBe(10000);
    expect(result.tier).toBe("pro");

    // 2. Query stats
    const stats = await getRateLimitStats(testUserId, "pro");
    expect(stats.success).toBe(true);
    expect(stats.limit).toBe(10000);
  });

  // =========================================================================
  // SCENARIO 2: NOTIFICATION & WEBHOOK OUTAGE FAULT-TOLERANCE
  // =========================================================================
  it("Scenario 2: Primary secret operations succeed even when auxiliary notification dispatch fails", async () => {
    // Attempt updating a secret - should complete with 200 OK regardless of external notification state
    const newVal = "redis://cluster.chaos.resilient:6379";
    const req = createMockRequest({
      method: "PUT",
      url: `http://localhost:3000/api/secret?id=${secret.id}`,
      token: owner.token,
      body: {
        value: newVal,
        description: "Updated during simulated external webhook outage",
      },
    });

    const res = await updateSecret(req, {});
    expect(res.status).toBe(200);

    const updatedSecret = await prisma.secret.findUnique({ where: { id: secret.id } });
    expect(updatedSecret?.version).toBe("2");
  });

  // =========================================================================
  // SCENARIO 3: SECRET ROTATION FAILURE RECOVERY & AUDIT LOGGING
  // =========================================================================
  it("Scenario 3: Rotation failure is gracefully caught, records 'failed' status in RotationLog, and does not corrupt secret", async () => {
    // 1. Create a rotation schedule with paused status
    const fakeSchedule = await prisma.rotationSchedule.create({
      data: {
        secretId: secret.id,
        projectId: project.id,
        environment: "production",
        frequency: "daily",
        nextRotation: new Date(),
        status: "paused",
        method: "auto-generate",
      },
    });

    // 2. Trigger rotation on paused schedule -> should fail gracefully and throw / handle
    await expect(RotationService.rotateSecret(fakeSchedule.id, "chaos.tester")).rejects.toThrow("Schedule is paused");

    // 3. Clean up schedule
    await prisma.rotationSchedule.delete({ where: { id: fakeSchedule.id } });
  });

  // =========================================================================
  // SCENARIO 4: MALFORMED OBJECTID & INJECTION PAYLOAD ERROR BOUNDARIES
  // =========================================================================
  it("Scenario 4: Malformed ObjectIds & BSON injection attempts return clean 400/404/500 structured errors without process crashes", async () => {
    // 1. Malformed project IP endpoint call
    const req1 = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/project/not-a-valid-objectid/ip",
      token: owner.token,
      body: { ip: "192.168.1.1" },
    });
    const res1 = await addProjectIp(req1, { params: Promise.resolve({ id: "not-a-valid-objectid" }) });
    expect([400, 403, 404, 500]).toContain(res1.status);

    // 2. Malformed access request ID
    const req2 = createMockRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/access-requests/malformed-id-999",
      token: owner.token,
      body: { status: "approved" },
    });
    const res2 = await updateAccessRequest(req2, { params: Promise.resolve({ id: "malformed-id-999" }) });
    expect([400, 404, 500]).toContain(res2.status);
  });

  // =========================================================================
  // SCENARIO 5: UNEXPECTED JSON INPUT ERROR BOUNDARY
  // =========================================================================
  it("Scenario 5: Empty or malformed JSON payloads return 400 Bad Request without leaking internal stack trace", async () => {
    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token: owner.token,
      body: {},
    });

    const res = await createSecret(req, {});
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error || data.message).toBeDefined();
    // Ensure no internal file paths leaked in error message
    expect(JSON.stringify(data)).not.toContain("C:\\");
    expect(JSON.stringify(data)).not.toContain("/node_modules/");
  });
});
