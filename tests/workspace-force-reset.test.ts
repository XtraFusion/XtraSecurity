import { POST as forceResetWorkspace } from "@/app/api/workspace/force-reset/route";
import { createMockRequest, createTestUser, createTestProject, cleanupTestData } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { generateRecoveryMnemonic, createWorkspaceVaultSentinel, verifyWorkspaceVaultSentinel } from "@/lib/crypto/e2ee";

describe("Workspace Force Key Reset & Data Wipe Suite (/api/workspace/force-reset)", () => {
  const tracker: {
    userIds: string[];
    workspaceIds: string[];
    projectIds: string[];
    branchIds: string[];
    secretIds: string[];
  } = {
    userIds: [],
    workspaceIds: [],
    projectIds: [],
    branchIds: [],
    secretIds: [],
  };

  afterAll(async () => {
    // Clean up any remaining test workspaces
    for (const wsId of tracker.workspaceIds) {
      await prisma.workspace.delete({ where: { id: wsId } }).catch(() => {});
    }
    await cleanupTestData(tracker);
  });

  it("1. Rejects unauthenticated requests with 401", async () => {
    const corruptedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.corrupted_payload.invalid_signature";
    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/workspace/force-reset",
      token: corruptedToken,
      body: { workspaceId: "some_ws_id", confirmation: "CONFIRM_FORCE_RESET" },
    });

    const res = await forceResetWorkspace(req, {});
    expect(res.status).toBe(401);
  });

  it("2. Rejects request when confirmation code is missing or incorrect", async () => {
    const { user, token } = await createTestUser({ role: "owner", tier: "enterprise" });
    tracker.userIds.push(user.id);

    const ws = await prisma.workspace.create({
      data: {
        name: "Test Reset WS",
        description: "Test description",
        workspaceType: "personal",
        createdBy: user.id,
      },
    });
    tracker.workspaceIds.push(ws.id);

    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/workspace/force-reset",
      token,
      body: { workspaceId: ws.id, confirmation: "WRONG_CODE" },
    });

    const res = await forceResetWorkspace(req, {});
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Confirmation code 'CONFIRM_FORCE_RESET' is required");
  });

  it("3. Successfully wipes all workspace projects & secrets and establishes new master sentinel", async () => {
    const { user, token } = await createTestUser({ role: "owner", tier: "enterprise" });
    tracker.userIds.push(user.id);

    // Initial old master key
    const oldKey = "old-workspace-passphrase-word-one-two-three";
    const oldSentinel = createWorkspaceVaultSentinel("ws_target_123", oldKey);

    const ws = await prisma.workspace.create({
      data: {
        name: "Target Wiped WS",
        description: "Will be wiped",
        workspaceType: "personal",
        createdBy: user.id,
        vaultSentinel: JSON.stringify(oldSentinel),
      },
    });
    tracker.workspaceIds.push(ws.id);

    // Create 2 projects under this workspace with secrets & branches
    const proj1 = await createTestProject(user, ws.id, { name: "Project Alpha" });
    const proj2 = await createTestProject(user, ws.id, { name: "Project Beta" });
    tracker.projectIds.push(proj1.id, proj2.id);

    const secret1 = await prisma.secret.create({
      data: {
        key: "SECRET_ONE",
        value: ["encrypted_value_alpha"],
        description: "Secret 1",
        environmentType: "production",
        version: "1.0",
        projectId: proj1.id,
        type: "string",
        history: [],
        updatedBy: user.id,
        permission: [],
        rotationPolicy: "manual",
      },
    });
    tracker.secretIds.push(secret1.id);

    // Verify initial data exists
    const initialProjects = await prisma.project.findMany({ where: { workspaceId: ws.id } });
    expect(initialProjects.length).toBe(2);

    // Generate brand-new 24-word recovery phrase for force reset
    const newMnemonic = generateRecoveryMnemonic();
    const newSentinel = createWorkspaceVaultSentinel(ws.id, newMnemonic.mnemonic);

    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/workspace/force-reset",
      token,
      body: {
        workspaceId: ws.id,
        confirmation: "CONFIRM_FORCE_RESET",
        newVaultSentinel: JSON.stringify(newSentinel),
      },
    });

    const res = await forceResetWorkspace(req, {});
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.purgedProjectIds).toContain(proj1.id);
    expect(data.purgedProjectIds).toContain(proj2.id);

    // Assert all projects in this workspace were permanently deleted
    const remainingProjects = await prisma.project.findMany({ where: { workspaceId: ws.id } });
    expect(remainingProjects.length).toBe(0);

    // Assert secrets were permanently deleted
    const remainingSecrets = await prisma.secret.findMany({ where: { projectId: { in: [proj1.id, proj2.id] } } });
    expect(remainingSecrets.length).toBe(0);

    // Assert workspace sentinel is now updated to the NEW key and old key is rejected
    const updatedWs = await prisma.workspace.findUnique({ where: { id: ws.id } });
    expect(updatedWs?.vaultSentinel).toBeDefined();

    // Verify cryptographic sentinel with new key succeeds
    expect(verifyWorkspaceVaultSentinel(updatedWs!.vaultSentinel!, ws.id, newMnemonic.mnemonic)).toBe(true);
    // Verify cryptographic sentinel with old key strictly fails
    expect(verifyWorkspaceVaultSentinel(updatedWs!.vaultSentinel!, ws.id, oldKey)).toBe(false);
  });
});
