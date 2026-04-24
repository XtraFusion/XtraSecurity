import prisma from "./db";
import { redis } from "./redis";

export async function getUserTeamRole(userId: string, teamId: string) {
  const teamUser = await prisma.teamUser.findFirst({ where: { userId, teamId } });
  return teamUser?.role || null;
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
    if (sa && sa.projectId === projectId) return "developer";
    return null;
  }

  if (String(project.userId) === String(userId)) return "owner";

  // Check workspace ownership
  const workspace = await prisma.workspace.findUnique({
      where: { id: project.workspaceId },
      select: { createdBy: true }
  });
  if (String(workspace?.createdBy) === String(userId)) return "owner";

  // Check team membership
  // fetch teams linked to project where user is a member
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

  // Collect roles from all teams linked to this project
  const roles = teamProjects
    .flatMap(tp => tp.team.members)
    .filter(m => m.userId === userId)
    .map(m => m.role);
  
  if (roles.length === 0) return null;

  // Determine highest role
  let finalRole = "viewer";
  if (roles.includes("owner")) finalRole = "owner";
  else if (roles.includes("admin")) finalRole = "admin";
  else if (roles.includes("developer")) finalRole = "developer";
  else if (roles.includes("viewer")) finalRole = "viewer";
  
  if (redis) {
      redis.set(cacheKey, finalRole, "EX", 300).catch(()=>{});
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
  // Validate MongoDB ObjectID format (24 hex characters)
  if (!workspaceId || !/^[0-9a-fA-F]{24}$/.test(workspaceId)) {
    return null;
  }

  // Check ownership
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { createdBy: true }
  });

  if (workspace && String(workspace.createdBy) === String(userId)) return "owner";

  // Check team membership in this workspace
  const teamUsers = await prisma.teamUser.findMany({
    where: { 
      userId,
      status: "active",
      team: {
        workspaceId
      }
    },
    include: { team: true }
  });

  if (teamUsers.length === 0) return null;

  const roles = teamUsers.map(tu => tu.role);

  if (roles.includes("admin")) return "admin";
  if (roles.includes("member") || roles.includes("owner")) return "member";
  
  return "viewer"; // Default fallback
}

// ACCESS REVIEW PERMISSIONS
export const AccessReviewPermissions = {
  READ: "access_review.read",
  WRITE: "access_review.write",
  START_CYCLE: "access_review.start_cycle"
};

/**
 * Checks if a user has a specific permission.
 * Falls back to "admin" role check for backward compatibility.
 */
export async function hasPermission(userId: string, permissionAction: string) {
  // 1. Fetch user to check global role (Legacy/Fallback)
  const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
  });

  if (user?.role === "admin") return true;

  // 2. RBAC Check (V2)
  // Split permissionAction into resource/action (e.g. "access_review.read" -> res="access_review", act="read")
  const parts = permissionAction.split(".");
  if (parts.length < 2) return false;
  
  const resource = parts[0];
  const action = parts.slice(1).join("."); // join remainder

  // Find if user has a role that maps to this permission
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

  for (const ur of userRoles) {
      for (const rp of ur.role.permissions) {
          if (rp.permission.resource === resource && rp.permission.action === action) {
              return true; // Found a match!
          }
           // Handle "all" or specific constraints if needed, but for now simple match
      }
  }

  return false;
}

/**
 * JIT ACCESS CHECK
 * Checks if a user has active, approved, and non-expired temporary access
 */
export async function getUserSecretAccess(userId: string, projectId: string, secretId?: string) {
  const cacheKey = `rbac:secretaccess:${userId}:${projectId}:${secretId || 'none'}`;
  
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch(e) {}
  }

  // 1. Get standard role
  const role = await getUserProjectRole(userId, projectId);
  
  // Owners and Admins always have access
  if (role === "owner" || role === "admin") return { hasAccess: true, role };
  
  // 2. Check for active JIT Access Request
  const now = new Date();
  
  // Find an approved request that hasn't expired yet
  const activeRequest = await prisma.accessRequest.findFirst({
    where: {
      userId,
      status: "approved",
      expiresAt: { gt: now },
      OR: [
        secretId ? { secretIds: { has: secretId } } : { id: "undefined-id-bypass" }, // If secretId passed, check array inclusion
        { projectId: projectId, secretIds: { isEmpty: true } } // Project-wide JIT (empty array implies blanket access)
      ]
    },
    orderBy: { expiresAt: "desc" }
  });

  if (activeRequest) {
    const result = { hasAccess: true, role: "developer", isJit: true, expiresAt: activeRequest.expiresAt };
    if (redis) redis.set(cacheKey, JSON.stringify(result), "EX", 60).catch(()=>{});
    return result;
  }

  // 3. Fallback to standard role access
  const result = { hasAccess: false, role };
  if (redis) redis.set(cacheKey, JSON.stringify(result), "EX", 60).catch(()=>{});
  return result;
}
