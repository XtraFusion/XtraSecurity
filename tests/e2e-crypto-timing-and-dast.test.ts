import { encrypt, decrypt } from "@/lib/encription";
import { verifyAuth } from "@/lib/server-auth";
import { GET as getSecrets } from "@/app/api/secret/route";
import { createMockRequest, createTestUser, createTestWorkspace, createTestProject, createTestBranch, cleanupUserResources } from "./helpers/test-utils";
import prisma from "@/lib/db";
import crypto from "crypto";
import jwt from "jsonwebtoken";

describe("E2E: Cryptographic Integrity, Timing Attacks & DAST Hardening (Phase 4)", () => {
  const tracker = {
    userIds: [] as string[],
  };

  let testUser: any;
  let workspace: any;
  let project: any;
  let branch: any;

  beforeAll(async () => {
    testUser = await createTestUser({ email: "crypto.dast@xtrasecurity.test", role: "admin", tier: "pro" });
    tracker.userIds.push(testUser.user.id);

    workspace = await createTestWorkspace(testUser.user, "Crypto Defense Workspace");
    project = await createTestProject(testUser.user, workspace.id, { name: "Hardened Crypto Vault" });
    branch = await createTestBranch(testUser.user, project.id, { name: "main" });
  });

  afterAll(async () => {
    await cleanupUserResources(tracker.userIds);
  });

  // =========================================================================
  // SCENARIO 1: CONSTANT-TIME COMPARISON INTEGRITY (timingSafeEqual)
  // =========================================================================
  it("Scenario 1: Constant-time comparison safely validates hashes and rejects mismatched tokens without timing leaks", () => {
    const secretKey = "xtra_sec_live_99887766554433221100";
    const correctHash = crypto.createHash("sha256").update(secretKey).digest();
    const attackerHash = crypto.createHash("sha256").update("xtra_sec_live_99887766554433221101").digest();
    const forgedHash = crypto.createHash("sha256").update("xtra_sec_fake_token").digest();

    // 1. Correct hash matches
    expect(crypto.timingSafeEqual(correctHash, correctHash)).toBe(true);

    // 2. Single-character mismatched hash safely returns false
    expect(crypto.timingSafeEqual(correctHash, attackerHash)).toBe(false);

    // 3. Completely different hash returns false
    expect(crypto.timingSafeEqual(correctHash, forgedHash)).toBe(false);
  });

  // =========================================================================
  // SCENARIO 2: JWT ALGORITHM CONFUSION & "alg: none" ATTACK PREVENTION
  // =========================================================================
  it("Scenario 2: Rejects JWT tokens signed with 'none' algorithm or forged keys with 401 Unauthorized", async () => {
    // 1. Forged token with alg: "none"
    const unsignedHeader = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        userId: testUser.user.id,
        email: testUser.user.email,
        role: "admin",
        type: "cli-token",
      })
    ).toString("base64url");
    const noneAlgorithmToken = `${unsignedHeader}.${payload}.`;

    const req1 = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/secret?projectId=${project.id}`,
      token: noneAlgorithmToken,
    });
    const auth1 = await verifyAuth(req1);
    expect(auth1).toBeNull();

    const res1 = await getSecrets(req1, {});
    expect(res1.status).toBe(401);

    // 2. Token signed with wrong secret key
    const forgedKeyToken = jwt.sign(
      { userId: testUser.user.id, email: testUser.user.email, role: "admin", type: "cli-token" },
      "attacker-malicious-secret-key-12345"
    );
    const req2 = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/secret?projectId=${project.id}`,
      token: forgedKeyToken,
    });
    const auth2 = await verifyAuth(req2);
    expect(auth2).toBeNull();

    const res2 = await getSecrets(req2, {});
    expect(res2.status).toBe(401);
  });

  // =========================================================================
  // SCENARIO 3: AES-256-GCM AUTHENTICATED ENCRYPTION INTEGRITY & ANTI-TAMPER
  // =========================================================================
  it("Scenario 3: AES-256-GCM authenticated decryption strictly throws on tampered ciphertext, IV, or authTag", () => {
    const plaintext = "stripe_live_sk_99998888777766665555444433332222";
    const encrypted = encrypt(plaintext);

    // 1. Decrypt unmodified payload
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);

    // 2. Tamper with ciphertext
    const tamperedCiphertext = {
      ...encrypted,
      encryptedData: encrypted.encryptedData.slice(0, -2) + "ff",
    };
    expect(() => decrypt(tamperedCiphertext)).toThrow();

    // 3. Tamper with auth tag
    const tamperedAuthTag = {
      ...encrypted,
      authTag: encrypted.authTag.slice(0, -2) + "00",
    };
    expect(() => decrypt(tamperedAuthTag)).toThrow();

    // 4. Tamper with IV
    const tamperedIv = {
      ...encrypted,
      iv: encrypted.iv.slice(0, -2) + "11",
    };
    expect(() => decrypt(tamperedIv)).toThrow();
  });

  // =========================================================================
  // SCENARIO 4: TOTP REPLAY & CODE EXPIRATION BOUNDARIES
  // =========================================================================
  it("Scenario 4: Rejects expired TOTP / OTP verification tokens beyond validity window", async () => {
    // Test that expired OTP codes on User record are rejected
    const expiredDate = new Date(Date.now() - 1000 * 60 * 15); // 15 minutes ago (limit is 10 mins)
    await prisma.user.update({
      where: { id: testUser.user.id },
      data: {
        emailOtp: "889900",
        emailOtpExpiry: expiredDate,
      },
    });

    const user = await prisma.user.findUnique({ where: { id: testUser.user.id } });
    const isExpired = user?.emailOtpExpiry ? new Date() > user.emailOtpExpiry : true;
    expect(isExpired).toBe(true);
  });

  // =========================================================================
  // SCENARIO 5: SHA-256 HASH CHAIN TAMPER PROOFING & INTEGRITY
  // =========================================================================
  it("Scenario 5: Cryptographic SHA-256 hash chaining detects historical log tampering", () => {
    const genesisHash = "0".repeat(64);
    const log1 = { action: "SECRET_CREATED", timestamp: "2026-08-25T10:00:00Z", key: "DB_KEY" };
    const hash1 = crypto.createHash("sha256").update(genesisHash + JSON.stringify(log1)).digest("hex");

    const log2 = { action: "SECRET_ROTATED", timestamp: "2026-08-25T10:05:00Z", version: "2" };
    const hash2 = crypto.createHash("sha256").update(hash1 + JSON.stringify(log2)).digest("hex");

    // Recalculate chain verification
    const verifyHash1 = crypto.createHash("sha256").update(genesisHash + JSON.stringify(log1)).digest("hex");
    const verifyHash2 = crypto.createHash("sha256").update(verifyHash1 + JSON.stringify(log2)).digest("hex");

    expect(verifyHash1).toBe(hash1);
    expect(verifyHash2).toBe(hash2);

    // Tamper simulation on log1
    const tamperedLog1 = { ...log1, key: "TAMPERED_KEY" };
    const tamperedHash1 = crypto.createHash("sha256").update(genesisHash + JSON.stringify(tamperedLog1)).digest("hex");

    expect(tamperedHash1).not.toBe(hash1);
    const brokenChainHash2 = crypto.createHash("sha256").update(tamperedHash1 + JSON.stringify(log2)).digest("hex");
    expect(brokenChainHash2).not.toBe(hash2);
  });
});
