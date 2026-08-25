import { GET as getAccessRequests, POST as createAccessRequest } from "@/app/api/access-requests/route";
import { PATCH as updateAccessRequest } from "@/app/api/access-requests/[id]/route";
import { createMockRequest, createTestUser, createTestWorkspace, createTestProject, cleanupUserResources, createTestTeam } from "./helpers/test-utils";
import prisma from "@/lib/db";

describe("E2E: Access Requests Page & JIT Management", () => {
  const tracker = {
    userIds: [] as string[],
    requestIds: [] as string[]
  };

  let admin: any;
  let viewer: any;
  let workspace: any;
  let project: any;
  let secret: any;
  let team: any;

  beforeAll(async () => {
    // Create users
    admin = await createTestUser({ email: "admin.access@example.com", role: "admin" });
    viewer = await createTestUser({ email: "viewer.access@example.com", role: "user" });
    tracker.userIds.push(admin.user.id, viewer.user.id);

    // Create workspace & project
    workspace = await createTestWorkspace(admin.user);
    project = await createTestProject(admin.user, workspace.id);

    // Create a team in workspace and add viewer
    team = await createTestTeam(admin.user, workspace.id, { roles: ["viewer"] });
    await prisma.teamUser.create({
      data: {
        teamId: team.id,
        userId: viewer.user.id,
        role: "viewer",
        status: "active"
      }
    });
    
    // Assign team to project
    await prisma.teamProject.create({
      data: {
        teamId: team.id,
        projectId: project.id
      }
    });

    // Create a target secret
    secret = await prisma.secret.create({
      data: {
        key: "PROD_DATABASE_URL",
        value: ["encrypted_value"],
        description: "DB connection",
        environmentType: "production",
        version: "1",
        history: [],
        updatedBy: admin.user.id,
        permission: [],
        rotationPolicy: "manual",
        projectId: project.id,
        type: "shared",
        shadowValue: []
      },
    });
  });

  afterAll(async () => {
    // We clean up user resources directly which handles workspaces, projects, teams, etc.
    await cleanupUserResources(tracker.userIds);
  });

  let pendingRequestId: string;

  it("1. POST /api/access-requests -> Viewer creates a JIT access request", async () => {
    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/access-requests",
      token: viewer.token,
      headers: {
        "x-user-id": viewer.user.id,
        "x-user-role": "user",
        "x-user-email": "viewer.access@example.com",
      },
      body: {
        projectId: project.id,
        secretId: secret.id,
        reason: "Need temporary access to debug production issue",
        duration: 60, // 60 minutes
      }
    });

    const res = await createAccessRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.id).toBeDefined();
    expect(data.status).toBe("pending");
    expect(data.reason).toBe("Need temporary access to debug production issue");
    expect(data.duration).toBe(60);
    expect(data.projectId).toBe(project.id);
    expect(data.workspaceId).toBe(workspace.id);
    expect(data.secretIds).toContain(secret.id);
    expect(data.userId).toBe(viewer.user.id);

    pendingRequestId = data.id;
    tracker.requestIds.push(data.id);
  });

  it("2. GET /api/access-requests -> Admin sees all requests in workspace", async () => {
    const req = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/access-requests?workspaceId=${workspace.id}`,
      token: admin.token,
      headers: {
        "x-user-id": admin.user.id,
        "x-user-role": "admin",
        "x-user-email": "admin.access@example.com",
      }
    });

    const res = await getAccessRequests(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    
    const request = data.find((r: any) => r.id === pendingRequestId);
    expect(request).toBeDefined();
    expect(request.user.id).toBe(viewer.user.id);
    expect(request.project.id).toBe(project.id);
  });

  it("3. GET /api/access-requests -> Viewer sees only their own requests", async () => {
    // Create another request by a different user
    const otherUser = await createTestUser({ email: "other@example.com", role: "user" });
    tracker.userIds.push(otherUser.user.id);
    
    const otherRequest = await prisma.accessRequest.create({
        data: {
            userId: otherUser.user.id,
            workspaceId: workspace.id,
            projectId: project.id,
            reason: "Another reason",
            duration: 30,
            status: "pending"
        }
    });
    tracker.requestIds.push(otherRequest.id);

    const req = createMockRequest({
      method: "GET",
      url: `http://localhost:3000/api/access-requests?workspaceId=${workspace.id}`,
      token: viewer.token,
      headers: {
        "x-user-id": viewer.user.id,
        "x-user-role": "user",
        "x-user-email": "viewer.access@example.com",
      }
    });

    const res = await getAccessRequests(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(Array.isArray(data)).toBe(true);
    // Viewer should only see their own pendingRequestId, not the otherUser's
    const ourRequest = data.find((r: any) => r.id === pendingRequestId);
    expect(ourRequest).toBeDefined();
    const theirRequest = data.find((r: any) => r.userId === otherUser.user.id);
    expect(theirRequest).toBeUndefined();
  });

  it("4. PATCH /api/access-requests/[id] -> Admin approves the request", async () => {
    const req = createMockRequest({
      method: "PATCH",
      url: `http://localhost:3000/api/access-requests/${pendingRequestId}`,
      token: admin.token,
      headers: {
        "x-user-id": admin.user.id,
        "x-user-role": "admin",
        "x-user-email": "admin.access@example.com",
      },
      body: { status: "approved" }
    });
    
    const res = await updateAccessRequest(req, { params: Promise.resolve({ id: pendingRequestId }) });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.status).toBe("approved");
    expect(data.approvedBy).toBe(admin.user.id);
    expect(data.approvedAt).toBeDefined();
    expect(data.expiresAt).toBeDefined();
    
    // Check audit log was created
    const auditLog = await prisma.auditLog.findFirst({
        where: { entityId: pendingRequestId, action: "jit_request_approved" }
    });
    expect(auditLog).toBeDefined();
    expect(auditLog?.userId).toBe(admin.user.id);
  });

  it("5. PATCH /api/access-requests/[id] -> Viewer CANNOT approve their own request", async () => {
    const maliciousReqId = (await prisma.accessRequest.create({
        data: {
            userId: viewer.user.id,
            workspaceId: workspace.id,
            projectId: project.id,
            reason: "Malicious self-approve",
            duration: 30,
            status: "pending"
        }
    })).id;
    tracker.requestIds.push(maliciousReqId);

    const req = createMockRequest({
      method: "PATCH",
      url: `http://localhost:3000/api/access-requests/${maliciousReqId}`,
      token: viewer.token,
      headers: {
        "x-user-id": viewer.user.id,
        "x-user-role": "user",
        "x-user-email": "viewer.access@example.com",
      },
      body: { status: "approved" }
    });
    
    const res = await updateAccessRequest(req, { params: Promise.resolve({ id: maliciousReqId }) });
    expect(res.status).toBe(403);
  });

  it("6. PATCH /api/access-requests/[id] -> Admin rejects a request", async () => {
    const newReqId = (await prisma.accessRequest.create({
        data: {
            userId: viewer.user.id,
            workspaceId: workspace.id,
            projectId: project.id,
            reason: "Another request to be rejected",
            duration: 30,
            status: "pending"
        }
    })).id;
    tracker.requestIds.push(newReqId);

    const req = createMockRequest({
      method: "PATCH",
      url: `http://localhost:3000/api/access-requests/${newReqId}`,
      token: admin.token,
      headers: {
        "x-user-id": admin.user.id,
        "x-user-role": "admin",
        "x-user-email": "admin.access@example.com",
      },
      body: { status: "rejected" }
    });
    
    const res = await updateAccessRequest(req, { params: Promise.resolve({ id: newReqId }) });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.status).toBe("rejected");
    expect(data.approvedBy).toBeNull();
  });
});
