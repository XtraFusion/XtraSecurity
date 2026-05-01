import prisma from "./db";
import { redis } from "./redis";

const CACHE_TTL = 600; // 10 minutes

export async function getUserTeamRole(userId: string, teamId: string) {
  const cacheKey = `rbac:teamrole:${userId}:${teamId}`;
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    } catch (e) {}
  }

  const teamUser = await prisma.teamUser.findFirst({ where: { userId, teamId } });
  const role = teamUser?.role || null;

  if (redis && role) {
    await redis.set(cacheKey, role, "EX", CACHE_TTL).catch(() => {});
  }
  return role;
}

export async function getUserProjectRole(userId: string, projectId: string) {
  const cacheKey = `rbac:projectrole:${userId}:${projectId}`;
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    } catch (e) {}
  }

  // Check ownership
  const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true, workspaceId: true }
  });
  
  if (!project) return null;

  // Handle Service Accounts
  if (userId.startsWith("sa_")) {
    const saId = userId.replace("sa_", "");
    const sa = await prisma.serviceAccount.findUnique({
        where: { id: saId },
        select: { projectId: true }
    });
    // Service Account is strictly locked to its own project
    const role = (sa && sa.projectId === projectId) ? "developer" : null;
    if (redis && role) {
      await redis.set(cacheKey, role, "EX", CACHE_TTL).catch(() => {});
    }
    return role;
  }

  if (String(project.userId) === String(userId)) return "owner";

  // Check workspace ownership
  const workspace = await prisma.workspace.findUnique({
      where: { id: project.workspaceId },
      select: { createdBy: true }
  });
  if (String(workspace?.createdBy) === String(userId)) return "owner";

  // Check team membership
  const teamProjects = await prisma.teamProject.findMany({
      where: { projectId },
      include: {
          team: {
              include: {
                  members: {
                      where: { userId, status: "active" }
                  }
              }
          }
      }
  });

  const roles = teamProjects
    .flatMap(tp => tp.team.members)
    .filter(m => m.userId === userId)
    .map(m => m.role);
  
  if (roles.length === 0) return null;

  let finalRole = "viewer";
  if (roles.includes("owner")) finalRole = "owner";
  else if (roles.includes("admin")) finalRole = "admin";
  else if (roles.includes("developer")) finalRole = "developer";
  
  if (redis) {
      redis.set(cacheKey, finalRole, "EX", CACHE_TTL).catch(()=>{});
  }
  
  return finalRole;
}

export function canManageMembers(role: string | null) {
  return role === "owner" || role === "admin";
}

export function canEditRole(currentRole: string | null, targetRole: string) {
  if (currentRole === "owner") return true;
  if (currentRole === "admin" && targetRole !== "owner") return true;
  return false;
}

export function canRemoveMember(currentRole: string | null, targetRole: string) {
  if (currentRole === "owner" && targetRole !== "owner") return true;
  if (currentRole === "admin" && targetRole !== "owner" && targetRole !== "admin") return true;
  return false;
}

export async function getUserWorkspaceRole(userId: string, workspaceId: string) {
  if (!workspaceId || !/^[0-9a-fA-F]{24}$/.test(workspaceId)) return null;

  const cacheKey = `rbac:workspacerole:${userId}:${workspaceId}`;
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    } catch (e) {}
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { createdBy: true }
  });

  if (workspace && String(workspace.createdBy) === String(userId)) {
    if (redis) redis.set(cacheKey, "owner", "EX", CACHE_TTL).catch(() => {});
    return "owner";
  }

  const teamUsers = await prisma.teamUser.findMany({
    where: { 
      userId,
      status: "active",
      team: { workspaceId }
    },
    include: { team: true }
  });

  if (teamUsers.length === 0) return null;

  const roles = teamUsers.map(tu => tu.role);
  let finalRole = "viewer";
  if (roles.includes("admin")) finalRole = "admin";
  else if (roles.includes("member") || roles.includes("owner")) finalRole = "member";
  
  if (redis) {
    redis.set(cacheKey, finalRole, "EX", CACHE_TTL).catch(() => {});
  }
  return finalRole;
}

export const AccessReviewPermissions = {
  READ: "access_review.read",
  WRITE: "access_review.write",
  START_CYCLE: "access_review.start_cycle"
};

export async function hasPermission(userId: string, permissionAction: string) {
  const cacheKey = `rbac:permission:${userId}:${permissionAction}`;
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached === "true";
    } catch (e) {}
  }

  const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
  });

  if (user?.role === "admin") {
    if (redis) redis.set(cacheKey, "true", "EX", CACHE_TTL).catch(() => {});
    return true;
  }

  const parts = permissionAction.split(".");
  if (parts.length < 2) return false;
  
  const resource = parts[0];
  const action = parts.slice(1).join(".");

  const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
          role: {
              include: {
                  permissions: {
                      include: {
                          permission: true
                      }
                  }
              }
          }
      }
  });

  let hasPerm = false;
  for (const ur of userRoles) {
      for (const rp of ur.role.permissions) {
          if (rp.permission.resource === resource && rp.permission.action === action) {
              hasPerm = true;
              break;
          }
      }
      if (hasPerm) break;
  }

  if (redis) {
    redis.set(cacheKey, hasPerm ? "true" : "false", "EX", CACHE_TTL).catch(() => {});
  }
  return hasPerm;
}

export async function getUserSecretAccess(userId: string, projectId: string, secretId?: string) {
  const cacheKey = `rbac:secretaccess:${userId}:${projectId}:${secretId || 'none'}`;
  
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch(e) {}
  }

  const role = await getUserProjectRole(userId, projectId);
  if (role === "owner" || role === "admin") return { hasAccess: true, role };
  
  const now = new Date();

  // 2. Check for active Break Glass session
  const activeBreakGlass = await prisma.breakGlassSession.findFirst({
    where: {
      userId,
      projectId,
      isActive: true,
      expiresAt: { gt: now }
    }
  });

  if (activeBreakGlass) {
    const result = { hasAccess: true, role: "admin", isBreakGlass: true, expiresAt: activeBreakGlass.expiresAt };
    if (redis) redis.set(cacheKey, JSON.stringify(result), "EX", 60).catch(()=>{});
    return result;
  }

  // 3. Check for approved JIT request
  const activeRequest = await prisma.accessRequest.findFirst({
    where: {
      userId,
      status: "approved",
      expiresAt: { gt: now },
      OR: [
        secretId ? { secretIds: { has: secretId } } : { id: "undefined-id-bypass" },
        { projectId: projectId, secretIds: { isEmpty: true } }
      ]
    },
    orderBy: { expiresAt: "desc" }
  });

  if (activeRequest) {
    const result = { hasAccess: true, role: "developer", isJit: true, expiresAt: activeRequest.expiresAt };
    if (redis) redis.set(cacheKey, JSON.stringify(result), "EX", 60).catch(()=>{});
    return result;
  }

  const result = { hasAccess: false, role };
  if (redis) redis.set(cacheKey, JSON.stringify(result), "EX", 60).catch(()=>{});
  return result;
}

export async function invalidateUserRbacCache(userId: string) {
  if (!redis) return;
  try {
    const keys = await redis.keys(`rbac:*:${userId}:*`);
    const permissionKeys = await redis.keys(`rbac:permission:${userId}:*`);
    const allKeys = [...keys, ...permissionKeys];
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }
  } catch (e) {
    console.error("[RBAC] Cache invalidation failed:", e);
  }
}
