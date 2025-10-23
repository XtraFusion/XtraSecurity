import prisma from "./db";

export async function getUserTeamRole(userId: string, teamId: string) {
  const teamUser = await prisma.teamUser.findFirst({ where: { userId, teamId } });
  return teamUser?.role || null;
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
