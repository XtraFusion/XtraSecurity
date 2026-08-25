import { GET as getSecrets, POST as createSecret, PUT as updateSecret, DELETE as deleteSecret } from "@/app/api/secret/route";
import { POST as bulkCreateSecrets } from "@/app/api/secret/bulk/route";
import { POST as rollbackSecret } from "@/app/api/secret/rollback/route";
import { POST as copySecrets } from "@/app/api/secret/copy/route";
import { createMockRequest, createTestUser, createTestProject, createTestBranch, cleanupTestData } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encription";

describe("E2E: Cryptographic Secret Lifecycle & State Machine", () => {
  const tracker: {
    userIds: string[];
    projectIds: string[];
    branchIds: string[];
    secretIds: string[];
  } = {
    userIds: [],
    projectIds: [],
    branchIds: [],
    secretIds: [],
  };

  afterAll(async () => {
    await cleanupTestData(tracker);
  });

  it("should create a secret with AES-256-GCM encryption and masked HTTP response", async () => {
    const { user, token } = await createTestUser({ role: "owner", tier: "enterprise" });
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Crypto Project" });
    tracker.projectIds.push(project.id);

    const rawPlaintext = "super_secret_stripe_api_key_live_999";

    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token,
      body: {
        key: "STRIPE_API_KEY",
        value: rawPlaintext,
        description: "Stripe Live Key",
        environmentType: "production",
        projectId: project.id,
        type: "string",
      },
    });

    const res = await createSecret(req, {});
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.key).toBe("STRIPE_API_KEY");
    // Verify response does not leak raw plaintext or ciphertext IVs
    expect(data.value).toBe("[encrypted]");
    expect(data.id).toBeDefined();

    tracker.secretIds.push(data.id);

    // Verify DB level encryption
    const dbSecret = await prisma.secret.findUnique({ where: { id: data.id } });
    expect(dbSecret).not.toBeNull();
    expect(dbSecret?.value[0]).not.toBe(rawPlaintext);

    // Verify ciphertext structure (iv + encryptedData + authTag)
    const parsedPayload = JSON.parse(dbSecret?.value[0] || "{}");
    expect(parsedPayload.iv).toBeDefined();
    expect(parsedPayload.encryptedData).toBeDefined();
    expect(parsedPayload.authTag).toBeDefined();

    // Verify authenticated decryption returns exact original plaintext
    const decrypted = decrypt(parsedPayload);
    expect(decrypted).toBe(rawPlaintext);
  });

  it("should fetch and decrypt secrets in real-time for authorized caller", async () => {
    const { user, token } = await createTestUser({ role: "owner" });
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Decryption Test Project" });
    tracker.projectIds.push(project.id);

    // Create secret via POST
    const createReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token,
      body: {
        key: "DATABASE_PASSWORD",
        value: "P@ssw0rdSecure!2026",
        projectId: project.id,
        environmentType: "development",
        type: "string",
      },
    });

    const createRes = await createSecret(createReq, {});
    const createData = await createRes.json();
    tracker.secretIds.push(createData.id);

    // Fetch via GET /api/secret
    const getReq = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/secret?projectId=${project.id}`,
      token,
      searchParams: { projectId: project.id },
    });

    const getRes = await getSecrets(getReq, {});
    expect(getRes.status).toBe(200);

    const fetchedSecrets = await getRes.json();
    expect(Array.isArray(fetchedSecrets)).toBe(true);

    const target = fetchedSecrets.find((s: any) => s.key === "DATABASE_PASSWORD");
    expect(target).toBeDefined();
    expect(target.value).toBe("P@ssw0rdSecure!2026");
  });

  it("should import bulk secrets and ensure history is encrypted", async () => {
    const { user, token } = await createTestUser({ role: "owner", tier: "enterprise" });
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Bulk Import Project" });
    tracker.projectIds.push(project.id);

    const bulkReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret/bulk",
      token,
      body: {
        projectId: project.id,
        environmentType: "staging",
        secrets: [
          { key: "BULK_KEY_ONE", value: "val1" },
          { key: "BULK_KEY_TWO", value: "val2" },
        ],
      },
    });

    const bulkRes = await bulkCreateSecrets(bulkReq, {});
    expect(bulkRes.status).toBe(201);

    const bulkData = await bulkRes.json();
    expect(bulkData.count).toBe(2);

    // Verify DB history is encrypted, not raw plaintext
    const dbSecrets = await prisma.secret.findMany({ where: { projectId: project.id } });
    expect(dbSecrets.length).toBe(2);

    for (const sec of dbSecrets) {
      tracker.secretIds.push(sec.id);
      const history = sec.history as any[];
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      const historyVal = history[0].value;
      // Must not be raw plaintext "val1" or "val2"
      expect(historyVal).not.toBe("val1");
      expect(historyVal).not.toBe("val2");
    }
  });

  it("should update secret with version bump and masked response", async () => {
    const { user, token } = await createTestUser({ role: "owner" });
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Update Test Project" });
    tracker.projectIds.push(project.id);

    // Create v1
    const createReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token,
      body: {
        key: "UPDATABLE_SECRET",
        value: "version_1_payload",
        projectId: project.id,
        environmentType: "development",
        type: "string",
      },
    });

    const createRes = await createSecret(createReq, {});
    const initial = await createRes.json();
    tracker.secretIds.push(initial.id);

    // Update to v2
    const updateReq = createMockRequest({
      method: "PUT",
      url: `http://localhost:3000/api/secret?id=${initial.id}`,
      token,
      searchParams: { id: initial.id },
      body: {
        id: initial.id,
        value: "version_2_updated_payload",
        description: "Bumped to v2",
      },
    });

    const updateRes = await updateSecret(updateReq, {});
    expect(updateRes.status).toBe(200);

    const updateData = await updateRes.json();
    expect(updateData.version).toBe("2");
    expect(updateData.value).toBe("[encrypted]");

    // Verify DB history contains v1 record
    const updatedDb = await prisma.secret.findUnique({ where: { id: initial.id } });
    expect(updatedDb?.version).toBe("2");
    const history = updatedDb?.history as any[];
    expect(history.length).toBeGreaterThanOrEqual(1);
  });

  it("should rollback a secret to a previous version", async () => {
    const { user, token } = await createTestUser({ role: "owner" });
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Rollback Test Project" });
    tracker.projectIds.push(project.id);

    // 1. Create Secret (v1)
    const createReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token,
      body: {
        key: "ROLLBACK_TEST_KEY",
        value: "original_v1_value",
        projectId: project.id,
        environmentType: "development",
        type: "string",
      },
    });
    const createRes = await createSecret(createReq, {});
    const initial = await createRes.json();
    tracker.secretIds.push(initial.id);

    // 2. Update to v2
    const updateReq = createMockRequest({
      method: "PUT",
      url: `http://localhost:3000/api/secret?id=${initial.id}`,
      token,
      searchParams: { id: initial.id },
      body: {
        id: initial.id,
        value: "bad_v2_value",
      },
    });
    await updateSecret(updateReq, {});

    // 3. Rollback to v1
    const rollbackReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret/rollback",
      token,
      body: {
        secretId: initial.id,
        targetVersion: "1",
        changeReason: "Reverting bad configuration",
      },
    });

    const rollbackRes = await rollbackSecret(rollbackReq);
    expect(rollbackRes.status).toBe(200);

    const rollbackData = await rollbackRes.json();
    expect(rollbackData.success).toBe(true);

    // 4. Fetch secret and verify decrypted value is restored to v1
    const getReq = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/secret?projectId=${project.id}`,
      token,
      searchParams: { projectId: project.id },
    });

    const getRes = await getSecrets(getReq, {});
    const fetched = await getRes.json();
    const target = fetched.find((s: any) => s.id === initial.id);
    expect(target.value).toBe("original_v1_value");
  });

  it("should copy secrets between branches and reject unauthorized cross-tenant copy", async () => {
    const { user, token } = await createTestUser({ role: "owner" });
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Copy Test Project" });
    tracker.projectIds.push(project.id);

    const sourceBranch = await createTestBranch(user, project.id, { name: "main" });
    const targetBranch = await createTestBranch(user, project.id, { name: "release-v1" });
    tracker.branchIds.push(sourceBranch.id, targetBranch.id);

    // Create secret on source branch
    const createReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token,
      body: {
        key: "EXPORTED_TOKEN",
        value: "token_12345",
        projectId: project.id,
        branchId: sourceBranch.id,
        environmentType: "development",
        type: "string",
      },
    });
    const createRes = await createSecret(createReq, {});
    const initial = await createRes.json();
    tracker.secretIds.push(initial.id);

    // 1. Authorized Branch Copy
    const copyReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret/copy",
      token,
      body: {
        sourceBranchId: sourceBranch.id,
        targetBranchId: targetBranch.id,
      },
    });

    const copyRes = await copySecrets(copyReq, {});
    expect(copyRes.status).toBe(200);

    const targetSecrets = await prisma.secret.findMany({ where: { branchId: targetBranch.id } });
    expect(targetSecrets.length).toBe(1);
    expect(targetSecrets[0].key).toBe("EXPORTED_TOKEN");
    tracker.secretIds.push(targetSecrets[0].id);

    // 2. SECURITY: Attacker attempts to copy from victim's source branch
    const attacker = await createTestUser({ name: "Attacker User" });
    tracker.userIds.push(attacker.user.id);

    const attackerProject = await createTestProject(attacker.user, undefined, { name: "Attacker Project" });
    tracker.projectIds.push(attackerProject.id);

    const attackerBranch = await createTestBranch(attacker.user, attackerProject.id, { name: "attacker-branch" });
    tracker.branchIds.push(attackerBranch.id);

    const illicitCopyReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret/copy",
      token: attacker.token,
      body: {
        sourceBranchId: sourceBranch.id, // Victim branch
        targetBranchId: attackerBranch.id,
      },
    });

    const illicitRes = await copySecrets(illicitCopyReq, {});
    expect(illicitRes.status).toBe(403);
  });

  it("should delete a secret", async () => {
    const { user, token } = await createTestUser({ role: "owner" });
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Delete Test Project" });
    tracker.projectIds.push(project.id);

    const createReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token,
      body: {
        key: "TO_BE_DELETED",
        value: "temporary_val",
        projectId: project.id,
        environmentType: "development",
        type: "string",
      },
    });
    const createRes = await createSecret(createReq, {});
    const initial = await createRes.json();

    const deleteReq = createMockRequest({
      method: "DELETE",
      url: `http://localhost:3000/api/secret?id=${initial.id}`,
      token,
      searchParams: { id: initial.id },
    });

    const deleteRes = await deleteSecret(deleteReq, {});
    expect(deleteRes.status).toBe(200);

    const dbSec = await prisma.secret.findUnique({ where: { id: initial.id } });
    expect(dbSec).toBeNull();
  });
});
