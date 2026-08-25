import { GET as getUserSettings, PATCH as updateUserSettings } from "@/app/api/user/settings/route";
import { POST as sendOtp } from "@/app/api/user/security/send-otp/route";
import { POST as verifyOtp } from "@/app/api/user/security/verify-otp/route";
import { PUT as updateWorkspace, GET as getWorkspace } from "@/app/api/workspace/route";
import { createMockRequest, createTestUser, createTestWorkspace, cleanupUserResources } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";

describe("E2E: User Settings & Security OTP Verification (/settings)", () => {
  const tracker = {
    userIds: [] as string[],
  };

  let user: any;
  let workspace: any;

  beforeAll(async () => {
    user = await createTestUser({ name: "Original Settings Name", email: "settings.user@xtrasecurity.test", role: "user", tier: "pro" });
    tracker.userIds.push(user.user.id);

    workspace = await createTestWorkspace(user.user, "Customizable Workspace");

    for (const uid of tracker.userIds) {
      await invalidateUserRbacCache(uid);
    }
  });

  afterAll(async () => {
    await cleanupUserResources(tracker.userIds);
  });

  // =========================================================================
  // 1. PROFILE SETTINGS
  // =========================================================================
  describe("1. Profile Settings Management", () => {
    it("GET /api/user/settings -> Retrieves user profile and initial MFA state", async () => {
      const req = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/user/settings",
        token: user.token,
      });

      const res = await getUserSettings(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.email).toBe(user.user.email);
      expect(data.name).toBe("Original Settings Name");
      expect(data.mfaEnabled).toBe(false);
      expect(data.tier).toBe("pro");
    });

    it("PATCH /api/user/settings (type: 'profile') -> Updates full name", async () => {
      const req = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/user/settings",
        token: user.token,
        body: {
          type: "profile",
          data: { name: "Updated Settings Display Name" },
        },
      });

      const res = await updateUserSettings(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.name).toBe("Updated Settings Display Name");

      // Verify in DB
      const dbUser = await prisma.user.findUnique({ where: { id: user.user.id } });
      expect(dbUser?.name).toBe("Updated Settings Display Name");
    });

    it("SECURITY: Direct security update is BLOCKED (requires OTP flow)", async () => {
      const req = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/user/settings",
        token: user.token,
        body: {
          type: "security",
          data: { mfaEnabled: true },
        },
      });

      const res = await updateUserSettings(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("OTP verification");
    });
  });

  // =========================================================================
  // 2. SECURITY OTP FLOW (Send & Verify OTP for MFA toggle)
  // =========================================================================
  describe("2. Security OTP Verification Flow", () => {
    it("POST /api/user/security/send-otp -> Generates and sets emailOtp on user record", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/user/security/send-otp",
        token: user.token,
      });

      const res = await sendOtp(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe("OTP sent successfully");

      // Confirm OTP is stored in DB
      const dbUser = await prisma.user.findUnique({ where: { id: user.user.id } });
      expect(dbUser?.emailOtp).toBeDefined();
      expect(dbUser?.emailOtp?.length).toBe(6);
      expect(dbUser?.emailOtpExpiry).toBeDefined();
    });

    it("POST /api/user/security/verify-otp -> Rejects incorrect verification code (400)", async () => {
      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/user/security/verify-otp",
        token: user.token,
        body: {
          otp: "000000",
          mfaEnabled: true,
        },
      });

      const res = await verifyOtp(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toContain("Invalid verification code");
    });

    it("POST /api/user/security/verify-otp -> Validates correct OTP and toggles MFA to true", async () => {
      const dbUser = await prisma.user.findUnique({ where: { id: user.user.id } });
      const validOtp = dbUser!.emailOtp!;

      const req = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/user/security/verify-otp",
        token: user.token,
        body: {
          otp: validOtp,
          mfaEnabled: true,
        },
      });

      const res = await verifyOtp(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify MFA is now true and OTP is cleared
      const updatedUser = await prisma.user.findUnique({ where: { id: user.user.id } });
      expect(updatedUser?.mfaEnabled).toBe(true);
      expect(updatedUser?.emailOtp).toBeNull();
    });
  });

  // =========================================================================
  // 3. WORKSPACE SETTINGS (Name & Branding Icon)
  // =========================================================================
  describe("3. Workspace Settings Customization", () => {
    it("PUT /api/workspace -> Updates designation name and visual branding icon", async () => {
      const req = createMockRequest({
        method: "PUT",
        url: "http://localhost:3000/api/workspace",
        token: user.token,
        body: {
          id: workspace.id,
          name: "Vault Zero Production",
          icon: "🚀",
        },
      });

      const res = await updateWorkspace(req, {});
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe("Vault Zero Production");
      expect(data.icon).toBe("🚀");

      // Verify in DB
      const dbWs = await prisma.workspace.findUnique({ where: { id: workspace.id } });
      expect(dbWs?.name).toBe("Vault Zero Production");
      expect(dbWs?.icon).toBe("🚀");
    });
  });
});
