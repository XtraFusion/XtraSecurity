/**
 * Input validation and sanitization utilities across XtraSecurity SaaS platform.
 * Defends against buffer exhaustion, path traversal, injection, ReDoS, and malformed inputs.
 */

export function validateBranchName(name: any): { valid: boolean; error?: string; cleanName?: string } {
  if (typeof name !== "string") {
    return { valid: false, error: "Branch name must be a string" };
  }

  const clean = name.trim();
  if (clean.length === 0) {
    return { valid: false, error: "Branch name cannot be empty" };
  }

  if (clean.length > 100) {
    return { valid: false, error: "Branch name cannot exceed 100 characters" };
  }

  // Prevent path traversal and malicious Git ref injection
  if (clean.startsWith("/") || clean.endsWith("/")) {
    return { valid: false, error: "Branch name cannot start or end with a slash" };
  }

  if (clean.includes("..") || clean.includes("//") || clean.includes("~") || clean.includes("^") || clean.includes(":") || clean.includes("?") || clean.includes("*") || clean.includes("[") || clean.includes("\\")) {
    return { valid: false, error: "Branch name contains invalid or unsafe characters (e.g. .., //, control characters)" };
  }

  const validBranchPattern = /^[a-zA-Z0-9_\-\.\/]+$/;
  if (!validBranchPattern.test(clean)) {
    return { valid: false, error: "Branch name can only contain letters, numbers, hyphens, underscores, dots, and single slashes" };
  }

  return { valid: true, cleanName: clean };
}

export function validateProjectName(name: any): { valid: boolean; error?: string; cleanName?: string } {
  if (typeof name !== "string") {
    return { valid: false, error: "Project name must be a string" };
  }

  const clean = name.trim();
  if (clean.length === 0) {
    return { valid: false, error: "Project name cannot be empty" };
  }

  if (clean.length > 100) {
    return { valid: false, error: "Project name cannot exceed 100 characters" };
  }

  return { valid: true, cleanName: clean };
}

export function validateWorkspaceName(name: any): { valid: boolean; error?: string; cleanName?: string } {
  if (typeof name !== "string") {
    return { valid: false, error: "Workspace name must be a string" };
  }

  const clean = name.trim();
  if (clean.length === 0) {
    return { valid: false, error: "Workspace name cannot be empty" };
  }

  if (clean.length > 100) {
    return { valid: false, error: "Workspace name cannot exceed 100 characters" };
  }

  return { valid: true, cleanName: clean };
}

export function validateSecretKey(key: any): { valid: boolean; error?: string; cleanKey?: string } {
  if (typeof key !== "string") {
    return { valid: false, error: "Secret key must be a string" };
  }

  const clean = key.trim();
  if (clean.length === 0) {
    return { valid: false, error: "Secret key cannot be empty" };
  }

  if (clean.length > 256) {
    return { valid: false, error: "Secret key cannot exceed 256 characters" };
  }

  const validKeyPattern = /^[a-zA-Z0-9_\-\.]+$/;
  if (!validKeyPattern.test(clean)) {
    return { valid: false, error: "Secret key can only contain alphanumeric characters, underscores, hyphens, and dots" };
  }

  return { valid: true, cleanKey: clean };
}

export function validateSecretValue(value: any): { valid: boolean; error?: string } {
  if (typeof value !== "string") {
    return { valid: false, error: "Secret value must be a string" };
  }

  // Max 1MB payload per secret value to prevent resource exhaustion
  const MAX_SECRET_BYTES = 1024 * 1024;
  if (value.length > MAX_SECRET_BYTES) {
    return { valid: false, error: "Secret value exceeds maximum allowable size (1MB)" };
  }

  return { valid: true };
}

export function validateTeamName(name: any): { valid: boolean; error?: string; cleanName?: string } {
  if (typeof name !== "string") {
    return { valid: false, error: "Team name must be a string" };
  }

  const clean = name.trim();
  if (clean.length === 0) {
    return { valid: false, error: "Team name cannot be empty" };
  }

  if (clean.length > 100) {
    return { valid: false, error: "Team name cannot exceed 100 characters" };
  }

  return { valid: true, cleanName: clean };
}

export function validateEmail(email: any): { valid: boolean; error?: string; cleanEmail?: string } {
  if (typeof email !== "string") {
    return { valid: false, error: "Email must be a string" };
  }

  const clean = email.trim().toLowerCase();
  if (clean.length === 0) {
    return { valid: false, error: "Email cannot be empty" };
  }

  if (clean.length > 254) {
    return { valid: false, error: "Email cannot exceed 254 characters" };
  }

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(clean)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true, cleanEmail: clean };
}

export function validateRole(role: any, allowedRoles: string[] = ["owner", "admin", "developer", "viewer"]): { valid: boolean; error?: string; cleanRole?: string } {
  if (typeof role !== "string") {
    return { valid: false, error: "Role must be a string" };
  }

  const clean = role.trim().toLowerCase();
  if (!allowedRoles.includes(clean)) {
    return { valid: false, error: `Invalid role: ${role}. Allowed roles: ${allowedRoles.join(", ")}` };
  }

  return { valid: true, cleanRole: clean };
}

export function validateIpAddress(ip: any): { valid: boolean; error?: string; cleanIp?: string } {
  if (typeof ip !== "string") {
    return { valid: false, error: "IP address must be a string" };
  }

  const clean = ip.trim();
  if (clean.length === 0) {
    return { valid: false, error: "IP address cannot be empty" };
  }

  // IPv4 regex (0.0.0.0 to 255.255.255.255, with optional CIDR /0-/32)
  const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/([0-9]|[1-2][0-9]|3[0-2]))?$/;
  
  // Basic IPv6 regex
  const ipv6Pattern = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  if (!ipv4Pattern.test(clean) && !ipv6Pattern.test(clean)) {
    return { valid: false, error: "Invalid IP address format. Must be a valid IPv4 or IPv6 address." };
  }

  return { valid: true, cleanIp: clean };
}

export function validateDescription(desc?: any, maxLen: number = 1000): { valid: boolean; error?: string; cleanDesc?: string } {
  if (desc === undefined || desc === null) {
    return { valid: true, cleanDesc: "" };
  }

  if (typeof desc !== "string") {
    return { valid: false, error: "Description must be a string" };
  }

  if (desc.length > maxLen) {
    return { valid: false, error: `Description cannot exceed ${maxLen} characters` };
  }

  return { valid: true, cleanDesc: desc };
}
