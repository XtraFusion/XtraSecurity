
export enum Decision {
  ALLOW = "allow",
  DENY = "deny",
  REQUIRES_ELEVATION = "requires_elevation"
}

// Enterprise Role Definitions
export enum UserRole {
  OWNER = "owner",
  ADMIN = "admin",
  DEVELOPER = "developer",
  VIEWER = "viewer",
  GUEST = "guest"
}

// Permission Actions
export const PermissionActions = {
  SECRETS_READ: "secrets.read",
  SECRETS_WRITE: "secrets.write",
  SECRETS_DELETE: "secrets.delete",
  USERS_MANAGE: "users.manage",
  BRANCHES_MANAGE: "branches.manage",
  AUDIT_READ: "audit.read",
  AUDIT_EXPORT: "audit.export",
  PROJECT_SETTINGS: "project.settings",
  PROJECT_DELETE: "project.delete",
  BILLING: "billing.manage"
} as const;

// Role Permission Matrix
// Format: role -> { action -> environments[] }
// "all" means all environments, specific envs like "development" restrict to that env
export const RolePermissions: Record<UserRole, Record<string, string[]>> = {
  [UserRole.OWNER]: {
    [PermissionActions.SECRETS_READ]: ["all"],
    [PermissionActions.SECRETS_WRITE]: ["all"],
    [PermissionActions.SECRETS_DELETE]: ["all"],
    [PermissionActions.USERS_MANAGE]: ["all"],
    [PermissionActions.BRANCHES_MANAGE]: ["all"],
    [PermissionActions.AUDIT_READ]: ["all"],
    [PermissionActions.AUDIT_EXPORT]: ["all"],
    [PermissionActions.PROJECT_SETTINGS]: ["all"],
    [PermissionActions.PROJECT_DELETE]: ["all"],
    [PermissionActions.BILLING]: ["all"]
  },
  [UserRole.ADMIN]: {
    [PermissionActions.SECRETS_READ]: ["all"],
    [PermissionActions.SECRETS_WRITE]: ["all"],
    [PermissionActions.SECRETS_DELETE]: ["all"],
    [PermissionActions.USERS_MANAGE]: ["all"],
    [PermissionActions.BRANCHES_MANAGE]: ["all"],
    [PermissionActions.AUDIT_READ]: ["all"],
    [PermissionActions.AUDIT_EXPORT]: ["all"],
    [PermissionActions.PROJECT_SETTINGS]: ["all"]
  },
  [UserRole.DEVELOPER]: {
    [PermissionActions.SECRETS_READ]: ["all"],
    [PermissionActions.SECRETS_WRITE]: ["development", "staging"],
    [PermissionActions.SECRETS_DELETE]: ["development"],
    [PermissionActions.BRANCHES_MANAGE]: ["all"],
    [PermissionActions.AUDIT_READ]: ["all"]
  },
  [UserRole.VIEWER]: {
    [PermissionActions.SECRETS_READ]: ["all"],
    [PermissionActions.AUDIT_READ]: ["all"]
  },
  [UserRole.GUEST]: {
    // Guest requires JIT for all access
  }
};

// Helper function to check if role has permission for environment
export function hasPermission(
  role: UserRole,
  action: string,
  environment: string = "all"
): boolean {
  const rolePerms = RolePermissions[role];
  if (!rolePerms) return false;
  
  const allowedEnvs = rolePerms[action];
  if (!allowedEnvs) return false;
  
  return allowedEnvs.includes("all") || allowedEnvs.includes(environment);
}

export interface AccessRequest {
  userId: string;
  projectId?: string; // Context
  resource: string; // "secret", "audit"
  action: string; // "read", "update"
  environment?: string; // "dev", "prod"
  ip?: string;
  context?: Record<string, any>; // Extra context (time, MFA status)
}
