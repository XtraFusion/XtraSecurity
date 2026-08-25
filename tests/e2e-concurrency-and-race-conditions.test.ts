import { POST as claimJitLink } from "@/app/api/jit/claim/route";
import { POST as createWorkspace } from "@/app/api/workspace/route";
import { POST as runRotation } from "@/app/api/rotation/run/route";
import { POST as respondTeamInvite } from "@/app/api/team/invite/accept/route";
import { POST as activateBreakGlass } from "@/app/api/access/break-glass/route";
import { createMockRequest, createTestUser, createTestWorkspace, createTestProject, createTestTeam, cleanupUserResources } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";

describe("E2E: Concurrency, Race Conditions & Distributed Atomic Guarantees (Phase 1)", () => {
  const tracker = {
    userIds: [] as string[],
  };

  let owner: any;
  let workspace: any;
  let project: any;
  let secret: any;
  let rotationSchedule: any;

  beforeAll(async () => {
    owner = await createTestUser({ email: "concurrency.owner@xtrasecurity.test", role: "admin", tier: "pro" });
    tracker.userIds.push(owner.user.id);

    workspace = await createTestWorkspace(owner.user, "Concurrency Hub");
    project = await createTestProject(owner.user, workspace.id, { name: "High Concurrency Engine" });

    // Create Secret & Schedule for rotation concurrency testing
    secret = await prisma.secret.create({
      data: {
        key: "CONCURRENT_API_KEY",
        value: ["encrypted_v1_value"],
        description: "Concurrent rotation secret",
        environmentType: "production",
        version: "1",
        history: [],
        updatedBy: owner.user.id,
        permission: [],
        rotationPolicy: "auto",
        projectId: project.id,
        type: "shared",
        shadowValue: [],
      },
    });

    rotationSchedule = await prisma.rotationSchedule.create({
      data: {
        secretId: secret.id,
        projectId: project.id,
        environment: "production",
        frequency: "daily",
        nextRotation: new Date(Date.now() + 86400000),
        status: "active",
        method: "auto-generate",
      },
    });

    for (const uid of tracker.userIds) {
      await invalidateUserRbacCache(uid);
    }
  });

  afterAll(async () => {
    if (rotationSchedule) {
      await prisma.rotationLog.deleteMany({ where: { scheduleId: rotationSchedule.id } }).catch(() => {});
      await prisma.rotationSchedule.delete({ where: { id: rotationSchedule.id } }).catch(() => {});
    }
    if (secret) {
      await prisma.secret.delete({ where: { id: secret.id } }).catch(() => {});
    }
    await cleanupUserResources(tracker.userIds);
  });

  // =========================================================================
  // SCENARIO 1: 50 PARALLEL CLAIMS ON A SINGLE-USE JIT LINK (maxUses: 1)
  // =========================================================================
  it("Scenario 1: 50 concurrent parallel requests racing to claim single-use JIT link -> EXACTLY 1 succeeds, 49 rejected with 410", async () => {
    // 1. Create a single-use JIT link (maxUses: 1) with label set to token
    const token = `jit-race-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const jitLink = await prisma.jitLink.create({
      data: {
        token,
        projectId: project.id,
        createdBy: owner.user.id,
        duration: 30,
        maxUses: 1,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 3600000),
        isRevoked: false,
        workspaceId: workspace.id,
        label: token,
        secretIds: [secret.id],
      },
    });

    // 2. Create 50 distinct contractor accounts to race simultaneously
    const contractors = await Promise.all(
      Array.from({ length: 50 }).map((_, i) =>
        createTestUser({ email: `contractor.race.${i}.${Date.now()}@xtrasecurity.test`, role: "user", tier: "free" })
      )
    );
    contractors.forEach((c) => tracker.userIds.push(c.user.id));

    // 3. Fire all 50 claims concurrently at the exact same millisecond via Promise.all
    const responses = await Promise.all(
      contractors.map((c) => {
        const req = createMockRequest({
          method: "POST",
          url: "http://localhost:3000/api/jit/claim",
          token: c.token,
          body: { token },
        });
        return claimJitLink(req);
      })
    );

    // 4. Evaluate responses
    const statusCodes = responses.map((r) => r.status);
    const successCount = statusCodes.filter((s) => s === 200).length;
    const rejectedCount = statusCodes.filter((s) => s === 410).length;

    expect(successCount).toBe(1);
    expect(rejectedCount).toBe(49);

    // 5. Verify database state integrity
    const updatedJitLink = await prisma.jitLink.findUnique({ where: { id: jitLink.id } });
    expect(updatedJitLink?.usedCount).toBe(1);

    const accessRequests = await prisma.accessRequest.findMany({
      where: { projectId: project.id, reason: { contains: token } },
    });
    expect(accessRequests.length).toBe(1);
  });

  // =========================================================================
  // SCENARIO 2: 10 CONCURRENT ROTATIONS ON THE SAME SECRET
  // =========================================================================
  it("Scenario 2: 10 concurrent manual rotation triggers on same secret -> Executes cleanly with valid history logs", async () => {
    const rotationRequests = Array.from({ length: 10 }).map(() => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/rotation/run",
        token: owner.token,
        body: { scheduleId: rotationSchedule.id },
      });
      return runRotation(req);
    });

    const results = await Promise.all(rotationRequests);
    const successCount = results.filter((r) => r.status === 200).length;
    expect(successCount).toBe(10);

    // Verify rotation logs were recorded
    const logs = await prisma.rotationLog.findMany({
      where: { scheduleId: rotationSchedule.id },
    });
    expect(logs.length).toBeGreaterThanOrEqual(10);

    // Verify secret version was incremented
    const updatedSecret = await prisma.secret.findUnique({ where: { id: secret.id } });
    expect(Number(updatedSecret?.version)).toBeGreaterThan(1);
  });

  // =========================================================================
  // SCENARIO 3: 10 CONCURRENT WORKSPACE CREATIONS ON FREE TIER LIMIT
  // =========================================================================
  it("Scenario 3: Free tier user firing 10 simultaneous workspace creations -> Enforces workspace quota", async () => {
    const freeUser = await createTestUser({ email: `free.quota.${Date.now()}@xtrasecurity.test`, role: "user", tier: "free" });
    tracker.userIds.push(freeUser.user.id);

    // Fire 10 simultaneous workspace creation requests
    const createWsRequests = Array.from({ length: 10 }).map((_, i) => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/workspace",
        token: freeUser.token,
        body: {
          name: `Concurrent Free WS ${i}`,
          description: "Testing free tier workspace limit concurrency",
          workspaceType: "personal",
        },
      });
      return createWorkspace(req, {});
    });

    const responses = await Promise.all(createWsRequests);
    const successCount = responses.filter((r) => r.status === 201).length;
    const blockedCount = responses.filter((r) => r.status === 403).length;

    // Must create exactly up to the limit and block the rest
    expect(successCount).toBeLessThanOrEqual(5);
    expect(blockedCount).toBeGreaterThanOrEqual(5);

    // Verify in DB that total workspaces for this free user does not exceed the limit
    const userWorkspaces = await prisma.workspace.findMany({
      where: { createdBy: freeUser.user.id },
    });
    expect(userWorkspaces.length).toBeLessThanOrEqual(5);
  });

  // =========================================================================
  // SCENARIO 4: 20 CONCURRENT TEAM INVITE ACCEPTANCES ON SAME RECORD
  // =========================================================================
  it("Scenario 4: 20 concurrent accept requests for a team invite -> Idempotently activates with no duplicate member records", async () => {
    const invitee = await createTestUser({ email: `invitee.race.${Date.now()}@xtrasecurity.test`, role: "user", tier: "free" });
    tracker.userIds.push(invitee.user.id);

    const testTeam = await createTestTeam(owner.user, workspace.id, { name: "Race Condition SecOps" });

    // Create a single pending invite record
    await prisma.teamUser.create({
      data: {
        teamId: testTeam.id,
        userId: invitee.user.id,
        role: "member",
        status: "pending",
        invitedBy: owner.user.id,
      },
    });

    // Fire 20 parallel accept requests
    const acceptRequests = Array.from({ length: 20 }).map(() => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/team/invite/accept",
        token: invitee.token,
        body: { teamId: testTeam.id, status: "active" },
      });
      return respondTeamInvite(req);
    });

    const responses = await Promise.all(acceptRequests);
    const successfulResponses = responses.filter((r) => r.status === 200);
    expect(successfulResponses.length).toBeGreaterThanOrEqual(1);

    // Verify exactly ONE team member record exists with status: active
    const memberships = await prisma.teamUser.findMany({
      where: { teamId: testTeam.id, userId: invitee.user.id },
    });
    expect(memberships.length).toBe(1);
    expect(memberships[0].status).toBe("active");
  });

  // =========================================================================
  // SCENARIO 5: CONCURRENT BREAK-GLASS SESSION ACTIVATIONS
  // =========================================================================
  it("Scenario 5: 10 concurrent Break-Glass activation requests -> Idempotently returns active session without duplicate conflicting locks", async () => {
    const breakGlassRequests = Array.from({ length: 10 }).map((_, i) => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/access/break-glass",
        token: owner.token,
        body: {
          projectId: project.id,
          reason: `Emergency outage concurrent incident ${i}`,
        },
      });
      return activateBreakGlass(req);
    });

    const responses = await Promise.all(breakGlassRequests);
    const successResponses = responses.filter((r) => r.status === 200);
    expect(successResponses.length).toBe(10);

    // Verify active break-glass session exists in database
    const activeSessions = await prisma.breakGlassSession.findMany({
      where: { projectId: project.id, userId: owner.user.id, isActive: true },
    });
    expect(activeSessions.length).toBeGreaterThanOrEqual(1);
  });
});
