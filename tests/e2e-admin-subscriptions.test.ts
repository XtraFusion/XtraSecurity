import { GET as getAdminSubscriptions, PUT as updateAdminSubscription } from "@/app/api/admin/subscriptions/route";
import { createMockRequest, createTestUser, cleanupUserResources } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";

describe("E2E: Admin Subscriptions Management (/admin/subscriptions)", () => {
  const tracker = {
    userIds: [] as string[],
  };

  let admin: any;
  let targetUser: any;
  let regularUser: any;

  beforeAll(async () => {
    admin = await createTestUser({ email: "admin.sub@xtrasecurity.test", role: "admin", tier: "pro" });
    targetUser = await createTestUser({ email: "target.sub@xtrasecurity.test", role: "user", tier: "free" });
    regularUser = await createTestUser({ email: "regular.sub@xtrasecurity.test", role: "user", tier: "free" });

    tracker.userIds.push(admin.user.id, targetUser.user.id, regularUser.user.id);

    for (const uid of tracker.userIds) {
      await invalidateUserRbacCache(uid);
    }
  });

  afterAll(async () => {
    await prisma.userSubscription.deleteMany({ where: { userId: { in: tracker.userIds } } }).catch(() => {});
    await cleanupUserResources(tracker.userIds);
  });

  it("1. SECURITY: Non-admin is blocked from fetching subscriptions (403 Forbidden)", async () => {
    const req = createMockRequest({
      method: "GET",
      url: "http://localhost:3000/api/admin/subscriptions",
      token: regularUser.token,
    });

    const res = await getAdminSubscriptions(req, {});
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Forbidden");
  });

  it("2. GET /api/admin/subscriptions -> Admin lists all users and subscription metadata", async () => {
    const req = createMockRequest({
      method: "GET",
      url: "http://localhost:3000/api/admin/subscriptions",
      token: admin.token,
    });

    const res = await getAdminSubscriptions(req, {});
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.users)).toBe(true);

    const foundTarget = data.users.find((u: any) => u.id === targetUser.user.id);
    expect(foundTarget).toBeDefined();
    expect(foundTarget.email).toBe(targetUser.user.email);
    expect(foundTarget.tier).toBe("free");
  });

  it("3. PUT /api/admin/subscriptions (action: 'activate_pro') -> Upgrades user to PRO tier & 10 workspaces", async () => {
    const req = createMockRequest({
      method: "PUT",
      url: "http://localhost:3000/api/admin/subscriptions",
      token: admin.token,
      body: {
        userId: targetUser.user.id,
        action: "activate_pro",
      },
    });

    const res = await updateAdminSubscription(req, {});
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe("Subscription updated");
    expect(data.subscription.plan).toBe("pro");
    expect(data.subscription.status).toBe("active");
    expect(data.subscription.workspaceLimit).toBe(10);

    // Verify DB update
    const dbUser = await prisma.user.findUnique({
      where: { id: targetUser.user.id },
      include: { userSubscription: true },
    });
    expect(dbUser?.tier).toBe("pro");
    expect(dbUser?.userSubscription?.plan).toBe("pro");
    expect(dbUser?.userSubscription?.workspaceLimit).toBe(10);
  });

  it("4. PUT /api/admin/subscriptions (action: 'renew') -> Extends PRO subscription by 1 year", async () => {
    const preSub = await prisma.userSubscription.findUnique({ where: { userId: targetUser.user.id } });
    const preEndDate = preSub?.endDate ? new Date(preSub.endDate).getTime() : Date.now();

    const req = createMockRequest({
      method: "PUT",
      url: "http://localhost:3000/api/admin/subscriptions",
      token: admin.token,
      body: {
        userId: targetUser.user.id,
        action: "renew",
      },
    });

    const res = await updateAdminSubscription(req, {});
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.subscription.status).toBe("active");

    const postEndDate = new Date(data.subscription.endDate).getTime();
    expect(postEndDate).toBeGreaterThan(preEndDate);
  });

  it("5. PUT /api/admin/subscriptions (action: 'deactivate') -> Downgrades user to FREE tier & inactive", async () => {
    const req = createMockRequest({
      method: "PUT",
      url: "http://localhost:3000/api/admin/subscriptions",
      token: admin.token,
      body: {
        userId: targetUser.user.id,
        action: "deactivate",
      },
    });

    const res = await updateAdminSubscription(req, {});
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.subscription.plan).toBe("free");
    expect(data.subscription.status).toBe("inactive");
    expect(data.subscription.workspaceLimit).toBe(3);

    const dbUser = await prisma.user.findUnique({ where: { id: targetUser.user.id } });
    expect(dbUser?.tier).toBe("free");
  });

  it("6. SECURITY: Non-admin cannot modify subscriptions (403 Forbidden)", async () => {
    const req = createMockRequest({
      method: "PUT",
      url: "http://localhost:3000/api/admin/subscriptions",
      token: regularUser.token,
      body: {
        userId: targetUser.user.id,
        action: "activate_pro",
      },
    });

    const res = await updateAdminSubscription(req, {});
    expect(res.status).toBe(403);
  });
});
