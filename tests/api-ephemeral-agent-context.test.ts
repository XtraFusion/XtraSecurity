import { createMockRequest, getResponseData } from "./helpers/test-utils";
import { POST } from "../app/api/agents/ephemeral-context/route";
import prisma from "../lib/db";

describe("Ephemeral Agent Contexts API", () => {
  let mockUser: any;
  let mockProject: any;

  beforeAll(async () => {
    // Create a mock user
    mockUser = await prisma.user.create({
      data: {
        email: `agent_test_${Date.now()}@example.com`,
        name: "Agent Tester",
        role: "owner",
        tier: "pro",
      },
    });

    // Create a mock workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: "Agent Workspace",
        description: "Testing",
        workspaceType: "personal",
        createdBy: mockUser.id,
      },
    });

    // Create a mock project
    mockProject = await prisma.project.create({
      data: {
        name: "Agent Project",
        description: "Testing Agents",
        userId: mockUser.id,
        workspaceId: workspace.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.serviceAccount.deleteMany({ where: { projectId: mockProject.id } });
    await prisma.project.delete({ where: { id: mockProject.id } });
    await prisma.workspace.deleteMany({ where: { createdBy: mockUser.id } });
    await prisma.user.delete({ where: { id: mockUser.id } });
  });

  it("should generate an ephemeral token restricted to 5 minutes", async () => {
    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/agents/ephemeral-context",
      body: {
        projectId: mockProject.id,
        agentName: "AutoGPT_Stripe",
        scopes: ["read:secret"],
        durationMinutes: 5,
      },
      token: require("jsonwebtoken").sign({ userId: mockUser.id, email: mockUser.email, role: "owner", type: "cli-token" }, process.env.NEXTAUTH_SECRET || "fallback"),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.agentToken).toBeDefined();
    expect(data.agentToken.startsWith("xtra_")).toBe(true);
    expect(data.scopes).toEqual(["read:secret"]);
    
    const expiresAt = new Date(data.expiresAt);
    const now = new Date();
    
    // Check that it expires roughly 5 minutes from now
    const diffMinutes = Math.round((expiresAt.getTime() - now.getTime()) / 60000);
    expect(diffMinutes).toBe(5);

    // Verify in DB
    const serviceAccount = await prisma.serviceAccount.findUnique({
      where: { id: data.serviceAccountId },
      include: { apiKeys: true }
    });

    expect(serviceAccount).toBeDefined();
    expect(serviceAccount?.isAgent).toBe(true);
    expect(serviceAccount?.apiKeys.length).toBe(1);
    expect(serviceAccount?.apiKeys[0].keyMask?.startsWith("xtra_...")).toBe(true);
  });

  it("should reject durations longer than 60 minutes", async () => {
    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/agents/ephemeral-context",
      body: {
        projectId: mockProject.id,
        agentName: "Rogue_Agent",
        scopes: ["read:secret", "write:secret"],
        durationMinutes: 120, // Too long!
      },
      token: require("jsonwebtoken").sign({ userId: mockUser.id, email: mockUser.email, role: "owner", type: "cli-token" }, process.env.NEXTAUTH_SECRET || "fallback"),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toMatch(/between 1 and 60 minutes/);
  });
});
