// =======================
// User & Auth Interfaces
// =======================
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date;
  image?: string | null;
  accounts?: Account[];
  sessions?: Session[];
  projects?: Project[];
  createdAt: Date;
  updatedAt: Date;
  role: string; // "admin" | "member" | etc.
  teamUsers?: TeamUser[];
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
  user?: User;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  user?: User;
}

export interface VerificationToken {
  id: string;
  identifier: string;
  token: string;
  expires: Date;
}

// =======================
// Team & Relations
// =======================
export interface Team {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  members?: TeamUser[];
  teamProjects?: TeamProject[];
  roles: string[];
}

export interface TeamUser {
  id: string;
  teamId: string;
  userId: string;
  role: string; // e.g. "owner", "viewer"
  joinedAt: Date;
  team?: Team;
  user?: User;
}

export interface TeamProject {
  id: string;
  teamId: string;
  projectId: string;
  team?: Team;
  project?: Project;
}

// =======================
// Project, Branch, Secret
// =======================
export interface CreateProject {
  id: string;
  name: string;
  description: string;
  status: string; // "active" | "archived"
  userId?: string;
  branch?: Branch[];
  user?: User;
  secret?: Secret[];
  createdAt: Date;
  updatedAt: Date;
  teamProjects?: TeamProject[];
}
export interface Project {
  id: string;
  name: string;
  description: string;
  status: string; // "active" | "archived"
  userId?: string;
  branch: Branch[];
  user?: User;
  secret?: Secret[];
  createdAt: Date;
  updatedAt: Date;
  teamProjects?: TeamProject[];
}

export interface Branch {
  id: string;
  name: string;
  description: string;
  createdBy: string; // userId
  projectId: string;
  createdAt: Date;
  project?: Project;
  secret?: Secret[];
  versionNo: string;
  permissions: string[];
}

export interface Secret {
  id: string;
  key: string;
  value: string;
  description: string;
  environment_type: string;
  version: string;
  projectId: string;
  branchId?: string | null;
  project?: Project;
  branch?: Branch | null;
  type: string;
  history: any; // JSON array (could define stricter SecretHistory type)
  lastUpdated: Date;
  updatedBy: string; // userId
  permission: string[];
  expiryDate?: Date | null;
  rotationPolicy: string; // "auto" | "manual" | "interval"
}
