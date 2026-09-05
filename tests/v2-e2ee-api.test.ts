import { GET as getSecretsV2, POST as createSecretV2, PUT as updateSecretV2, DELETE as deleteSecretV2 } from "@/app/api/v2/secret/route";
import { POST as bulkCreateSecretsV2 } from "@/app/api/v2/secret/bulk/route";
import { createMockRequest, createTestUser, createTestProject, cleanupTestData } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { deriveProjectKey, encryptSecretValue, decryptSecretValue } from "@/lib/crypto/e2ee";

describe("Phase 3 E2EE: Full Zero-Knowledge API Lifecycle Suite (/api/v2/secret)", () => {
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

  it("Scenario 1: Client encrypts plaintext, backend stores ciphertext without knowing plaintext", async () => {
    const { user, token } = await createTestUser({ role: "owner", tier: "enterprise" });
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "ZeroKnowledge Project" });
    tracker.projectIds.push(project.id);

    const projectKey = deriveProjectKey(project.id);
    const plaintextSecret = "super_confidential_db_password_e2ee_456!";

    // 1. Client encrypts locally
    const clientEncrypted = encryptSecretValue(plaintextSecret, projectKey);
    expect(clientEncrypted.ciphertext).not.toEqual(plaintextSecret);

    // 2. Client posts pre-encrypted payload to v2
    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/v2/secret",
      token,
      body: {
        key: "DATABASE_PASSWORD",
        ciphertext: clientEncrypted.ciphertext,
        iv: clientEncrypted.iv,
        authTag: clientEncrypted.authTag,
        description: "Zero-Knowledge Database Password",
        environmentType: "production",
        projectId: project.id,
      },
    });

    const res = await createSecretV2(req, {});
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.zeroKnowledge).toBe(true);
    expect(data.id).toBeDefined();
    tracker.secretIds.push(data.id);

    // 3. Verify Database level: Plaintext NEVER exists anywhere in DB
    const dbRecord = await prisma.secret.findUnique({
      where: { id: data.id }
    });
    expect(dbRecord).not.toBeNull();
    const rawVal = dbRecord!.value[0];
    expect(rawVal).not.toContain(plaintextSecret);
    expect(rawVal).toContain(clientEncrypted.ciphertext);

    // 4. Client fetches from GET /api/v2/secret
    const getReq = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/v2/secret?projectId=${project.id}`,
      token,
    });
    const getRes = await getSecretsV2(getReq, {});
    expect(getRes.status).toBe(200);

    const getData = await getRes.json();
    expect(getData.zeroKnowledge).toBe(true);
    expect(getData.secrets).toHaveLength(1);

    const retrievedSecret = getData.secrets[0];
    expect(retrievedSecret.key).toBe("DATABASE_PASSWORD");

    // 5. Client decrypts locally using its project key
    const decryptedLocally = decryptSecretValue(retrievedSecret.encryptedPayload, projectKey);
    expect(decryptedLocally).toBe(plaintextSecret);
  });

  it("Scenario 2: Client updates secret via PUT /api/v2/secret and versions are preserved in DB", async () => {
    const { user, token } = await createTestUser({ role: "owner", tier: "enterprise" });
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "ZK Update Project" });
    tracker.projectIds.push(project.id);

    const projectKey = deriveProjectKey(project.id);
    const initialPlaintext = "initial_secret_111";
    const initialEncrypted = encryptSecretValue(initialPlaintext, projectKey);

    // Create secret
    const postReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/v2/secret",
      token,
      body: {
        key: "ROTATING_TOKEN",
        ciphertext: initialEncrypted.ciphertext,
        iv: initialEncrypted.iv,
        authTag: initialEncrypted.authTag,
        environmentType: "staging",
        projectId: project.id,
      },
    });
    const postRes = await createSecretV2(postReq, {});
    const postData = await postRes.json();
    const secretId = postData.id;
    tracker.secretIds.push(secretId);

    // Now update via PUT /api/v2/secret with new encrypted payload
    const updatedPlaintext = "updated_secret_222_rotated!";
    const updatedEncrypted = encryptSecretValue(updatedPlaintext, projectKey);

    const putReq = createMockRequest({
      method: "PUT",
      url: `http://localhost:3000/api/v2/secret?id=${secretId}`,
      token,
      body: {
        id: secretId,
        ciphertext: updatedEncrypted.ciphertext,
        iv: updatedEncrypted.iv,
        authTag: updatedEncrypted.authTag,
        description: "Rotated token",
        changeReason: "Scheduled client-side rotation",
      },
    });

    const putRes = await updateSecretV2(putReq, {});
    expect(putRes.status).toBe(200);

    const putData = await putRes.json();
    expect(putData.success).toBe(true);
    expect(putData.version).toBe("2");
    expect(putData.zeroKnowledge).toBe(true);

    // Verify DB record and history
    const updatedDb = await prisma.secret.findUnique({
      where: { id: secretId },
    });
    expect(updatedDb!.version).toBe("2");
    expect(Array.isArray(updatedDb!.history)).toBe(true);
    expect(updatedDb!.history).toHaveLength(2);

    // Client decrypts retrieved secret
    const getReq = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/v2/secret?id=${secretId}`,
      token,
    });
    const getRes = await getSecretsV2(getReq, {});
    const getData = await getRes.json();
    const decrypted = decryptSecretValue(getData.secret.encryptedPayload, projectKey);
    expect(decrypted).toBe(updatedPlaintext);
  });

  it("Scenario 3: Bulk creation via POST /api/v2/secret/bulk", async () => {
    const { user, token } = await createTestUser({ role: "owner", tier: "enterprise" });
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "ZK Bulk Project" });
    tracker.projectIds.push(project.id);

    const projectKey = deriveProjectKey(project.id);
    const envVars = [
      { key: "API_GATEWAY_URL", value: "https://api.internal.corp" },
      { key: "REDIS_CONNECTION", value: "rediss://:auth@cluster.internal:6379" },
      { key: "SESSION_HMAC_KEY", value: "abcdef1234567890abcdef1234567890" },
    ];

    const encryptedBatch = envVars.map(item => {
      const enc = encryptSecretValue(item.value, projectKey);
      return {
        key: item.key,
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        authTag: enc.authTag,
        environmentType: "production",
      };
    });

    const bulkReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/v2/secret/bulk",
      token,
      body: {
        projectId: project.id,
        secrets: encryptedBatch,
      },
    });

    const bulkRes = await bulkCreateSecretsV2(bulkReq, {});
    expect(bulkRes.status).toBe(201);

    const bulkData = await bulkRes.json();
    expect(bulkData.success).toBe(true);
    expect(bulkData.count).toBe(3);
    expect(bulkData.zeroKnowledge).toBe(true);

    bulkData.secrets.forEach((s: any) => tracker.secretIds.push(s.id));

    // Verify all 3 can be retrieved and decrypted locally
    const getReq = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/v2/secret?projectId=${project.id}`,
      token,
    });
    const getRes = await getSecretsV2(getReq, {});
    const getData = await getRes.json();
    expect(getData.secrets).toHaveLength(3);

    for (const original of envVars) {
      const found = getData.secrets.find((s: any) => s.key === original.key);
      expect(found).toBeDefined();
      const decrypted = decryptSecretValue(found.encryptedPayload, projectKey);
      expect(decrypted).toBe(original.value);
    }
  });

  it("Scenario 4: Secure Deletion via DELETE /api/v2/secret", async () => {
    const { user, token } = await createTestUser({ role: "owner", tier: "enterprise" });
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "ZK Delete Project" });
    tracker.projectIds.push(project.id);

    const projectKey = deriveProjectKey(project.id);
    const enc = encryptSecretValue("to_be_deleted", projectKey);

    const postReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/v2/secret",
      token,
      body: {
        key: "DISPOSABLE_SECRET",
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        authTag: enc.authTag,
        environmentType: "development",
        projectId: project.id,
      },
    });
    const postRes = await createSecretV2(postReq, {});
    const postData = await postRes.json();
    const secretId = postData.id;

    // Delete via DELETE /api/v2/secret
    const deleteReq = createMockRequest({
      method: "DELETE",
      url: `http://localhost:3000/api/v2/secret?id=${secretId}`,
      token,
    });

    const deleteRes = await deleteSecretV2(deleteReq, {});
    expect(deleteRes.status).toBe(200);

    const deleteData = await deleteRes.json();
    expect(deleteData.success).toBe(true);
    expect(deleteData.zeroKnowledge).toBe(true);

    // Confirm it no longer exists
    const dbCheck = await prisma.secret.findUnique({ where: { id: secretId } });
    expect(dbCheck).toBeNull();
  });
});
