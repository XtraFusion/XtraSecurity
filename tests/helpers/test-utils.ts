import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export interface MockRequestOptions {
  method?: string;
  url?: string;
  body?: any;
  token?: string;
  apiKey?: string;
  searchParams?: Record<string, string>;
  headers?: Record<string, string>;
}

export function createMockRequest(options: MockRequestOptions = {}): NextRequest {
  const {
    method = "GET",
    url = "http://localhost:3000/api/test",
    body,
    token,
    apiKey,
    searchParams = {},
    headers = {},
  } = options;

  const targetUrl = new URL(url);
  Object.entries(searchParams).forEach(([k, v]) => {
    targetUrl.searchParams.set(k, v);
  });

  const reqHeaders = new Headers();
  reqHeaders.set("Content-Type", "application/json");

  if (token) {
    reqHeaders.set("Authorization", `Bearer ${token}`);
  }
  if (apiKey) {
    reqHeaders.set("x-api-key", apiKey);
  }

  Object.entries(headers).forEach(([k, v]) => {
    reqHeaders.set(k, v);
  });

  const reqInit: RequestInit = {
    method,
    headers: reqHeaders,
  };

  if (body && method !== "GET" && method !== "HEAD") {
    reqInit.body = JSON.stringify(body);
  }

  return new NextRequest(targetUrl.toString(), reqInit as any);
}

export function generateAuthToken(user: { id: string; email?: string | null; role?: string | null; tier?: string | null }): string {
  const secret = process.env.NEXTAUTH_SECRET || "e2e-test-nextauth-secret-key-32-chars-long";
  const payload = {
    id: user.id,
    userId: user.id,
    email: user.email || "test@xtrasecurity.in",
    role: user.role || "user",
    tier: user.tier || "free",
    type: "cli-token",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  };
  return jwt.sign(payload, secret);
}

export async function createTestUser(override: Partial<{ email: string; name: string; role: string; tier: string; mfaEnabled: boolean }> = {}) {
  const uniqueSuffix = Math.random().toString(36).substring(2, 10);
  const email = override.email || `test-user-${uniqueSuffix}@xtrasecurity.test`;
  const passwordHash = await bcrypt.hash("TestPassword123!", 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: override.name || `Test User ${uniqueSuffix}`,
      password: passwordHash,
      role: override.role || "user",
      tier: override.tier || "pro",
      mfaEnabled: override.mfaEnabled || false,
    },
  });

  const token = generateAuthToken(user);
  return { user, token };
}

/**
 * Gets or creates a persistent test user (Pro or Free) that remains in the DB across runs.
 */
export async function getOrCreatePersistentUser(tier: "pro" | "free", name?: string, roleSuffix?: string) {
  const suffix = roleSuffix ? `-${roleSuffix.toLowerCase()}` : "";
  const email = `${tier}-user${suffix}-e2e@xtrasecurity.test`;
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = await bcrypt.hash("PersistentPassword123!", 10);
    user = await prisma.user.create({
      data: {
        email,
        name: name || (tier === "pro" ? "Pro Enterprise User" : "Free Tier User"),
        password: passwordHash,
        role: "user",
        tier,
        mfaEnabled: tier === "pro",
      },
    });
  } else {
    // Ensure tier is updated if changed
    if (user.tier !== tier) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { tier },
      });
    }
  }

  const token = generateAuthToken(user);
  return { user, token };
}

export async function createTestWorkspace(user: { id: string }, name: string = "Test Workspace") {
  return await prisma.workspace.create({
    data: {
      name,
      description: "Automated Test Workspace",
      workspaceType: "personal",
      createdBy: user.id,
    },
  });
}

export async function createTestProject(
  user: { id: string },
  workspaceId?: string,
  override: Partial<{ name: string; description: string; environments: string[] }> = {}
) {
  let wsId = workspaceId;
  if (!wsId) {
    const ws = await createTestWorkspace(user);
    wsId = ws.id;
  }

  return await prisma.project.create({
    data: {
      name: override.name || "Test Project",
      description: override.description || "Test Project Description",
      userId: user.id,
      workspaceId: wsId,
    },
  });
}

export async function createTestBranch(
  user: { id: string },
  projectId: string,
  override: Partial<{ name: string; description: string; versionNo: string; permissions: string[] }> = {}
) {
  return await prisma.branch.create({
    data: {
      name: override.name || "main",
      description: override.description || "Main branch",
      versionNo: override.versionNo || "1",
      permissions: override.permissions || [],
      projectId,
      createdBy: user.id,
    },
  });
}

export async function createTestTeam(
  user: { id: string },
  workspaceId: string,
  override: Partial<{ name: string; description: string; teamColor: string; roles: string[] }> = {}
) {
  return await prisma.team.create({
    data: {
      name: override.name || "Engineering Team",
      description: override.description || "Engineering Team Description",
      teamColor: override.teamColor || "#3B82F6",
      roles: override.roles || ["member"],
      createdBy: user.id,
      workspaceId,
    },
  });
}

/**
 * Cleans up all data created by specific users WITHOUT deleting the users themselves.
 */
export async function cleanupUserResources(userIds: string[]) {
  try {
    // 1. Find all workspaces created by these users
    const workspaces = await prisma.workspace.findMany({
      where: { createdBy: { in: userIds } },
      select: { id: true },
    });
    const workspaceIds = workspaces.map((w) => w.id);

    // 2. Find all projects created by these users or in their workspaces
    const projects = await prisma.project.findMany({
      where: {
        OR: [{ userId: { in: userIds } }, { workspaceId: { in: workspaceIds } }],
      },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);

    // 3. Delete secrets in those projects
    if (projectIds.length) {
      await prisma.secret.deleteMany({
        where: { projectId: { in: projectIds } },
      }).catch(() => {});
    }

    // 4. Delete branches in those projects
    if (projectIds.length) {
      await prisma.branch.deleteMany({
        where: { projectId: { in: projectIds } },
      }).catch(() => {});
    }

    // 5. Delete access requests
    await prisma.accessRequest.deleteMany({
      where: {
        OR: [{ userId: { in: userIds } }, { projectId: { in: projectIds } }],
      },
    }).catch(() => {});

    // 6. Delete team projects & team users
    const teams = await prisma.team.findMany({
      where: {
        OR: [{ createdBy: { in: userIds } }, { workspaceId: { in: workspaceIds } }],
      },
      select: { id: true },
    });
    const teamIds = teams.map((t) => t.id);

    if (teamIds.length) {
      await prisma.teamProject.deleteMany({ where: { teamId: { in: teamIds } } }).catch(() => {});
      await prisma.teamUser.deleteMany({ where: { teamId: { in: teamIds } } }).catch(() => {});
      await prisma.team.deleteMany({ where: { id: { in: teamIds } } }).catch(() => {});
    }

    // 7. Delete projects
    if (projectIds.length) {
      await prisma.project.deleteMany({ where: { id: { in: projectIds } } }).catch(() => {});
    }

    // 8. Delete workspaces
    if (workspaceIds.length) {
      await prisma.workspace.deleteMany({ where: { id: { in: workspaceIds } } }).catch(() => {});
    }

    // 9. Delete audit logs & notifications for these users
    await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
  } catch (err) {
    console.error("Error cleaning up user resources:", err);
  }
}

export async function cleanupTestData(ids: {
  userIds?: string[];
  workspaceIds?: string[];
  projectIds?: string[];
  branchIds?: string[];
  secretIds?: string[];
}) {
  try {
    if (ids.secretIds?.length) {
      await prisma.secret.deleteMany({ where: { id: { in: ids.secretIds } } }).catch(() => {});
    }
    if (ids.branchIds?.length) {
      await prisma.branch.deleteMany({ where: { id: { in: ids.branchIds } } }).catch(() => {});
    }
    if (ids.projectIds?.length) {
      await prisma.secret.deleteMany({ where: { projectId: { in: ids.projectIds } } }).catch(() => {});
      await prisma.branch.deleteMany({ where: { projectId: { in: ids.projectIds } } }).catch(() => {});
      await prisma.project.deleteMany({ where: { id: { in: ids.projectIds } } }).catch(() => {});
    }
    if (ids.workspaceIds?.length) {
      await prisma.workspace.deleteMany({ where: { id: { in: ids.workspaceIds } } }).catch(() => {});
    }
    if (ids.userIds?.length) {
      await prisma.auditLog.deleteMany({ where: { userId: { in: ids.userIds } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: ids.userIds } } }).catch(() => {});
    }
  } catch (err) {
    // Ignore cleanup failures
  }
}
