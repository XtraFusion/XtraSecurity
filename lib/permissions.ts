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
      select: { userId: true }
  });
  
  if (!project) return null;
  if (project.userId === userId) return "owner";

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
  if (roles.includes("member")) return "member";
  
  return "viewer"; // Default fallback
}
