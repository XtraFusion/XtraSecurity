import prisma from "./db";

export async function getUserTeamRole(userId: string, teamId: string) {
  const teamUser = await prisma.teamUser.findFirst({ where: { userId, teamId } });
  return teamUser?.role || null;
}

// Helper to get effective project role
export async function getUserProjectRole(userId: string, projectId: string) {
  // Check ownership
  const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true, workspaceId: true }
  });
  
  if (!project) return null;

  if (project.userId === userId) return "owner";

  // Check workspace ownership
  const workspace = await prisma.workspace.findUnique({
      where: { id: project.workspaceId },
      select: { createdBy: true }
  });
  if (workspace?.createdBy === userId) return "owner";

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
  if (roles.includes("owner")) return "owner";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("developer")) return "developer";
  if (roles.includes("viewer")) return "viewer";
  
  return "viewer"; // Default fallback
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
  // Check ownership
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { createdBy: true }
  });

  if (workspace && workspace.createdBy === userId) return "owner";

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
