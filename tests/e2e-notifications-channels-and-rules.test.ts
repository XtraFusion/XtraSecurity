import { GET as getChannels, POST as createChannel, PATCH as updateChannel, DELETE as deleteChannel } from "@/app/api/notification-channels/route";
import { GET as getRules, POST as createRule, PATCH as updateRule, DELETE as deleteRule } from "@/app/api/notification-rules/route";
import { GET as getNotifications, PATCH as updateNotification, DELETE as deleteNotification } from "@/app/api/notifications/route";
import { createMockRequest, createTestUser, createTestWorkspace, cleanupUserResources } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";

describe("E2E: Notifications Hub, Rules & Channel Integration Lifecycle", () => {
  const tracker = {
    userIds: [] as string[],
  };

  let admin: any;
  let viewer: any;
  let workspace: any;

  beforeAll(async () => {
    admin = await createTestUser({ email: "notif.admin@xtrasecurity.test", role: "admin" });
    viewer = await createTestUser({ email: "notif.viewer@xtrasecurity.test", role: "user" });
    tracker.userIds.push(admin.user.id, viewer.user.id);

    workspace = await createTestWorkspace(admin.user, "Alerting Ops Hub");

    for (const uid of tracker.userIds) {
      await invalidateUserRbacCache(uid);
    }
  });

  afterAll(async () => {
    await cleanupUserResources(tracker.userIds);
  });

  // =========================================================================
  // 1. NOTIFICATION CHANNELS (CRUD & RBAC)
  // =========================================================================
  describe("1. Notification Channels Management", () => {
    let createdChannelId: string;

    it("POST /api/notification-channels -> Admin creates Slack notification channel", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/notification-channels",
        token: admin.token,
        body: {
          name: "SecOps Slack Channel",
          type: "slack",
          workspaceId: workspace.id,
          config: {
            slackChannel: "#security-alerts",
            webhookUrl: "https://hooks.slack.com/services/T00/B00/X00",
          },
        },
      });

      const res = await createChannel(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.channel).toBeDefined();
      expect(data.channel.id).toBeDefined();
      expect(data.channel.name).toBe("SecOps Slack Channel");
      expect(data.channel.type).toBe("slack");
      expect(data.channel.enabled).toBe(true);

      createdChannelId = data.channel.id;
    });

    it("GET /api/notification-channels -> Admin lists workspace channels", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/notification-channels?workspaceId=${workspace.id}`,
        token: admin.token,
      });

      const res = await getChannels(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.channels)).toBe(true);
      const ch = data.channels.find((c: any) => c.id === createdChannelId);
      expect(ch).toBeDefined();
      expect(ch.name).toBe("SecOps Slack Channel");
    });

    it("PATCH /api/notification-channels -> Admin toggles channel enabled state", async () => {
      const req = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/notification-channels",
        token: admin.token,
        body: {
          id: createdChannelId,
          enabled: false,
        },
      });

      const res = await updateChannel(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("SECURITY: Non-admin is blocked from creating channels (403 Forbidden)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/notification-channels",
        token: viewer.token,
        body: {
          name: "Malicious Channel",
          type: "webhook",
          workspaceId: workspace.id,
        },
      });

      const res = await createChannel(req);
      expect(res.status).toBe(403);
    });

    it("DELETE /api/notification-channels -> Admin deletes channel", async () => {
      const req = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/notification-channels?id=${createdChannelId}`,
        token: admin.token,
      });

      const res = await deleteChannel(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  // =========================================================================
  // 2. NOTIFICATION RULES (CRUD & RBAC)
  // =========================================================================
  describe("2. Notification Rules Management", () => {
    let createdRuleId: string;

    it("POST /api/notification-rules -> Admin creates rule for secret rotation & access denial", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/notification-rules",
        token: admin.token,
        body: {
          name: "High Severity Incident Rule",
          description: "Alerts SecOps when secret rotation fails or access is denied",
          triggers: ["rotation_failed", "access_denied", "suspicious_activity"],
          channels: ["email", "slack"],
          workspaceId: workspace.id,
          conditions: {
            environments: ["production"],
            severity: ["critical", "error"],
          },
        },
      });

      const res = await createRule(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.rule).toBeDefined();
      expect(data.rule.id).toBeDefined();
      expect(data.rule.name).toBe("High Severity Incident Rule");
      expect(data.rule.triggers).toContain("rotation_failed");
      expect(data.rule.enabled).toBe(true);

      createdRuleId = data.rule.id;
    });

    it("GET /api/notification-rules -> Admin retrieves workspace rules", async () => {
      const req = createMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/notification-rules?workspaceId=${workspace.id}`,
        token: admin.token,
      });

      const res = await getRules(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.rules)).toBe(true);
      const r = data.rules.find((rule: any) => rule.id === createdRuleId);
      expect(r).toBeDefined();
      expect(r.triggers).toContain("suspicious_activity");
    });

    it("PATCH /api/notification-rules -> Admin updates rule triggers and conditions", async () => {
      const req = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/notification-rules",
        token: admin.token,
        body: {
          id: createdRuleId,
          name: "Updated Incident Rule",
          enabled: false,
          triggers: ["rotation_failed", "access_denied"],
        },
      });

      const res = await updateRule(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("SECURITY: Non-admin is blocked from creating notification rules (403 Forbidden)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/notification-rules",
        token: viewer.token,
        body: {
          name: "Unauthorized Rule",
          triggers: ["secret_change"],
          workspaceId: workspace.id,
        },
      });

      const res = await createRule(req);
      expect(res.status).toBe(403);
    });

    it("DELETE /api/notification-rules -> Admin deletes rule", async () => {
      const req = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/notification-rules?id=${createdRuleId}`,
        token: admin.token,
      });

      const res = await deleteRule(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  // =========================================================================
  // 3. NOTIFICATION ALERTS LIFECYCLE (List, Mark As Read, Delete)
  // =========================================================================
  describe("3. Notification Alerts Handling", () => {
    let alert1Id: string;
    let alert2Id: string;

    beforeAll(async () => {
      const n1 = await prisma.notification.create({
        data: {
          userId: admin.user.id,
          userEmail: admin.user.email,
          taskTitle: "Secret Created in Production",
          description: "Database URL added to Banking Core",
          message: "New secret PROD_DB_URL created by Admin",
          status: "info",
          read: false,
          workspaceId: workspace.id,
        },
      });
      alert1Id = n1.id;

      const n2 = await prisma.notification.create({
        data: {
          userId: admin.user.id,
          userEmail: admin.user.email,
          taskTitle: "Critical Rotation Failure",
          description: "Rotation failed for AWS_KEY",
          message: "Scheduled rotation timed out",
          status: "critical",
          read: false,
          workspaceId: workspace.id,
        },
      });
      alert2Id = n2.id;
    });

    it("GET /api/notifications -> Retrieves alerts scoped to user", async () => {
      const req = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/notifications",
        token: admin.token,
      });

      const res = await getNotifications(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.notifications)).toBe(true);
      const found = data.notifications.find((n: any) => n.id === alert1Id);
      expect(found).toBeDefined();
      expect(found.read).toBe(false);
    });

    it("PATCH /api/notifications -> Marks notification as read", async () => {
      const req = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/notifications",
        token: admin.token,
        body: { id: alert1Id, read: true },
      });

      const res = await updateNotification(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.notification.read).toBe(true);
    });

    it("DELETE /api/notifications -> Deletes an alert", async () => {
      const req = createMockRequest({
        method: "DELETE",
        url: `http://localhost:3000/api/notifications?id=${alert2Id}`,
        token: admin.token,
      });

      const res = await deleteNotification(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const check = await prisma.notification.findUnique({ where: { id: alert2Id } });
      expect(check).toBeNull();
    });
  });
});
