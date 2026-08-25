import { GET as getSecrets, POST as createSecret, DELETE as deleteSecret } from "@/app/api/secret/route";
import { GET as getProjects } from "@/app/api/project/route";
import { createMockRequest, createTestUser, createTestWorkspace, createTestProject, createTestTeam, cleanupTestData } from "./helpers/test-utils";
import prisma from "@/lib/db";
import { invalidateUserRbacCache } from "@/lib/permissions";

describe("E2E: RBAC, Multi-Tenant Isolation & JIT Access Elevation", () => {
  const tracker: {
    userIds: string[];
    workspaceIds: string[];
    projectIds: string[];
    secretIds: string[];
  } = {
    userIds: [],
    workspaceIds: [],
    projectIds: [],
    secretIds: [],
  };

  afterAll(async () => {
    await cleanupTestData(tracker);
  });

  it("SECURITY: Multi-Tenant Isolation - Tenant B cannot read Tenant A's projects or secrets", async () => {
    // Tenant A (Acme Corp)
    const tenantA = await createTestUser({ name: "Alice Acme", role: "owner" });
    tracker.userIds.push(tenantA.user.id);

    const workspaceA = await createTestWorkspace(tenantA.user, "Acme Workspace");
    tracker.workspaceIds.push(workspaceA.id);

    const projectA = await createTestProject(tenantA.user, workspaceA.id, { name: "Acme Core Banking" });
    tracker.projectIds.push(projectA.id);

    // Create Secret in Project A
    const createReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token: tenantA.token,
      body: {
        key: "ACME_ROOT_CERT",
        value: "acme-banking-tls-private-cert",
        projectId: projectA.id,
        environmentType: "production",
        type: "string",
      },
    });
    const createRes = await createSecret(createReq, {});
    const secData = await createRes.json();
    tracker.secretIds.push(secData.id);

    // Tenant B (Evil Corp)
    const tenantB = await createTestUser({ name: "Bob Attacker", role: "owner" });
    tracker.userIds.push(tenantB.user.id);

    // 1. Tenant B attempts to list secrets in Project A
    const illicitGetReq = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/secret?projectId=${projectA.id}`,
      token: tenantB.token,
      searchParams: { projectId: projectA.id },
    });

    const illicitGetRes = await getSecrets(illicitGetReq, {});
    expect(illicitGetRes.status).toBe(403);

    // 2. Tenant B attempts to delete Project A's secret
    const illicitDeleteReq = createMockRequest({
      method: "DELETE",
      url: `http://localhost:3000/api/secret?id=${secData.id}`,
      token: tenantB.token,
      searchParams: { id: secData.id },
    });

    const illicitDeleteRes = await deleteSecret(illicitDeleteReq, {});
    expect(illicitDeleteRes.status).toBe(403);
  });

  it("should enforce Viewer role redaction ([REDACTED]) and block secret creation", async () => {
    // 1. Owner creates workspace, project, team, and secret
    const owner = await createTestUser({ name: "Team Owner", role: "owner" });
    tracker.userIds.push(owner.user.id);

    const workspace = await createTestWorkspace(owner.user, "Shared Workspace");
    tracker.workspaceIds.push(workspace.id);

    const project = await createTestProject(owner.user, workspace.id, { name: "Team Project" });
    tracker.projectIds.push(project.id);

    const team = await createTestTeam(owner.user, workspace.id, { name: "Audit Team" });

    await prisma.teamProject.create({
      data: { teamId: team.id, projectId: project.id },
    });

    // 2. Viewer user added to team with role 'viewer'
    const viewer = await createTestUser({ name: "Auditor Bob", role: "viewer" });
    tracker.userIds.push(viewer.user.id);

    await prisma.teamUser.create({
      data: { teamId: team.id, userId: viewer.user.id, role: "viewer", status: "active" },
    });

    // Create a secret as Owner
    const createReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token: owner.token,
      body: {
        key: "CONFIDENTIAL_FINANCIAL_API",
        value: "fin_live_99887766",
        projectId: project.id,
        environmentType: "production",
        type: "string",
      },
    });
    const createRes = await createSecret(createReq, {});
    const secData = await createRes.json();
    tracker.secretIds.push(secData.id);

    // 3. Viewer attempts to create a secret (Should be forbidden)
    const viewerCreateReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token: viewer.token,
      body: {
        key: "VIEWER_UNAUTHORIZED_KEY",
        value: "val",
        projectId: project.id,
        environmentType: "production",
        type: "string",
      },
    });
    const viewerCreateRes = await createSecret(viewerCreateReq, {});
    expect(viewerCreateRes.status).toBe(403);

    // 4. Viewer reads secrets -> value must be [REDACTED]
    await invalidateUserRbacCache(viewer.user.id);
    const viewerGetReq = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/secret?projectId=${project.id}`,
      token: viewer.token,
      searchParams: { projectId: project.id },
    });

    const viewerGetRes = await getSecrets(viewerGetReq, {});
    expect(viewerGetRes.status).toBe(200);

    const viewerData = await viewerGetRes.json();
    const target = viewerData.find((s: any) => s.id === secData.id);
    expect(target).toBeDefined();
    expect(target.value).toBe("[REDACTED]");
  });

  it("should elevate Viewer access to decrypted value upon JIT access request approval", async () => {
    const owner = await createTestUser({ name: "JIT Owner", role: "owner" });
    tracker.userIds.push(owner.user.id);

    const workspace = await createTestWorkspace(owner.user, "JIT Workspace");
    tracker.workspaceIds.push(workspace.id);

    const project = await createTestProject(owner.user, workspace.id, { name: "JIT Protected Project" });
    tracker.projectIds.push(project.id);

    const team = await createTestTeam(owner.user, workspace.id, { name: "Ops Team" });
    await prisma.teamProject.create({
      data: { teamId: team.id, projectId: project.id },
    });

    const viewer = await createTestUser({ name: "JIT Requester", role: "viewer" });
    tracker.userIds.push(viewer.user.id);

    await prisma.teamUser.create({
      data: { teamId: team.id, userId: viewer.user.id, role: "viewer", status: "active" },
    });

    // Create Secret
    const rawSecretValue = "sensitive_database_master_pass";
    const createReq = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/secret",
      token: owner.token,
      body: {
        key: "DB_MASTER_KEY",
        value: rawSecretValue,
        projectId: project.id,
        environmentType: "production",
        type: "string",
      },
    });
    const createRes = await createSecret(createReq, {});
    const secData = await createRes.json();
    tracker.secretIds.push(secData.id);

    // 1. Create Approved JIT Access Request for this secret
    const accessRequest = await prisma.accessRequest.create({
      data: {
        userId: viewer.user.id,
        projectId: project.id,
        secretIds: [secData.id],
        status: "approved",
        duration: 60,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour active
        reason: "Incident investigation INC-1029",
      },
    });

    await invalidateUserRbacCache(viewer.user.id);

    // 2. Viewer fetches secret with approved JIT -> should now receive decrypted plaintext!
    const jitGetReq = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/secret?projectId=${project.id}`,
      token: viewer.token,
      searchParams: { projectId: project.id },
    });

    const jitGetRes = await getSecrets(jitGetReq, {});
    expect(jitGetRes.status).toBe(200);

    const jitData = await jitGetRes.json();
    const target = jitData.find((s: any) => s.id === secData.id);
    expect(target.value).toBe(rawSecretValue);

    // 3. Revoke JIT Access Request
    await prisma.accessRequest.update({
      where: { id: accessRequest.id },
      data: { status: "revoked" },
    });

    await invalidateUserRbacCache(viewer.user.id);

    // 4. Viewer fetches again -> must be redacted back to [REDACTED]
    const postRevokeGetReq = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/secret?projectId=${project.id}`,
      token: viewer.token,
      searchParams: { projectId: project.id },
    });

    const postRevokeRes = await getSecrets(postRevokeGetReq, {});
    const postRevokeData = await postRevokeRes.json();
    const postRevokeTarget = postRevokeData.find((s: any) => s.id === secData.id);
    expect(postRevokeTarget.value).toBe("[REDACTED]");
  });
});
