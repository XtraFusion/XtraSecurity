import { GET as getProjects, POST as createProject, PUT as updateProject, DELETE as deleteProject } from "@/app/api/project/route";
import { POST as addProjectIp, DELETE as removeProjectIp } from "@/app/api/project/[id]/ip/route";
import { createMockRequest, createTestUser, createTestWorkspace, createTestProject, cleanupTestData } from "./helpers/test-utils";
import prisma from "@/lib/db";

describe("E2E: Project & Workspace Lifecycle", () => {
  const tracker: {
    userIds: string[];
    workspaceIds: string[];
    projectIds: string[];
  } = {
    userIds: [],
    workspaceIds: [],
    projectIds: [],
  };

  afterAll(async () => {
    await cleanupTestData(tracker);
  });

  it("should create a new project under a workspace", async () => {
    // 1. Create User and Workspace
    const { user, token } = await createTestUser({ role: "owner", tier: "pro" });
    tracker.userIds.push(user.id);

    const workspace = await createTestWorkspace(user, "Engineering Org");
    tracker.workspaceIds.push(workspace.id);

    // 2. Call POST /api/project
    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/project",
      token,
      body: {
        name: "Backend Core Service",
        description: "Core microservice for secret sync",
        workspaceId: workspace.id,
        environments: ["development", "staging", "production"],
      },
    });

    const res = await createProject(req, {});
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.name).toBe("Backend Core Service");
    expect(data.id).toBeDefined();
    expect(data.workspaceId).toBe(workspace.id);

    tracker.projectIds.push(data.id);

    // 3. Verify in DB directly
    const dbProject = await prisma.project.findUnique({ where: { id: data.id } });
    expect(dbProject).not.toBeNull();
    expect(dbProject?.name).toBe("Backend Core Service");
  });

  it("should list projects for the authenticated user", async () => {
    const { user, token } = await createTestUser();
    tracker.userIds.push(user.id);

    const workspace = await createTestWorkspace(user, "Analytics Org");
    tracker.workspaceIds.push(workspace.id);

    // Create 2 projects
    const p1 = await createTestProject(user, workspace.id, { name: "Project Alpha" });
    const p2 = await createTestProject(user, workspace.id, { name: "Project Beta" });
    tracker.projectIds.push(p1.id, p2.id);

    const req = createMockRequest({
      method: "GET",
      url: "http://localhost:3000/api/project",
      token,
      searchParams: { workspaceId: workspace.id },
    });

    const res = await getProjects(req, {});
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    const projectNames = data.map((p: any) => p.name);
    expect(projectNames).toContain("Project Alpha");
    expect(projectNames).toContain("Project Beta");
  });

  it("should add and remove IP restrictions from a project", async () => {
    const { user, token } = await createTestUser();
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Secured Gateway" });
    tracker.projectIds.push(project.id);

    // 1. Add IP restriction
    const addIpReq = createMockRequest({
      method: "POST",
      url: `http://localhost:3000/api/project/${project.id}/ip`,
      token,
      body: {
        ip: "203.0.113.45",
        description: "Office VPN Gateway",
      },
    });

    const addRes = await addProjectIp(addIpReq, { params: Promise.resolve({ id: project.id }) });
    expect(addRes.status).toBe(200);

    const addData = await addRes.json();
    expect(addData.success).toBe(true);

    // Verify DB update
    const updatedProject = await prisma.project.findUnique({ where: { id: project.id } });
    const ipList = (updatedProject?.ipRestrictions || []) as any[];
    expect(ipList.some((r) => r.ip === "203.0.113.45")).toBe(true);

    // 2. Remove IP restriction
    const removeIpReq = createMockRequest({
      method: "DELETE",
      url: `http://localhost:3000/api/project/${project.id}/ip`,
      token,
      body: {
        ip: "203.0.113.45",
      },
    });

    const removeRes = await removeProjectIp(removeIpReq, { params: Promise.resolve({ id: project.id }) });
    expect(removeRes.status).toBe(200);

    const postRemoveProject = await prisma.project.findUnique({ where: { id: project.id } });
    const postRemoveIps = (postRemoveProject?.ipRestrictions || []) as any[];
    expect(postRemoveIps.some((r) => r.ip === "203.0.113.45")).toBe(false);
  });

  it("should update project details", async () => {
    const { user, token } = await createTestUser();
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Original Name" });
    tracker.projectIds.push(project.id);

    const req = createMockRequest({
      method: "PUT",
      url: `http://localhost:3000/api/project?id=${project.id}`,
      token,
      searchParams: { id: project.id },
      body: {
        name: "Renamed Production API",
        description: "Updated description",
      },
    });

    const res = await updateProject(req, {});
    expect(res.status).toBe(200);

    const updated = await prisma.project.findUnique({ where: { id: project.id } });
    expect(updated?.name).toBe("Renamed Production API");
  });

  it("should delete a project and clean up records", async () => {
    const { user, token } = await createTestUser();
    tracker.userIds.push(user.id);

    const project = await createTestProject(user, undefined, { name: "Ephemeral Project" });

    const req = createMockRequest({
      method: "DELETE",
      url: `http://localhost:3000/api/project?id=${project.id}`,
      token,
      searchParams: { id: project.id },
    });

    const res = await deleteProject(req, {});
    expect(res.status).toBe(200);

    const deleted = await prisma.project.findUnique({ where: { id: project.id } });
    expect(deleted).toBeNull();
  });
});
