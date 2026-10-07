import axios from "axios";
import { getConfig, getAuthToken } from "./config";
import * as fs from "fs";
import * as path from "path";

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf-8")
);

const getClient = () => {
  const { apiUrl } = getConfig();
  const token = getAuthToken();

  const client = axios.create({
    baseURL: apiUrl,
    headers: {
      "Content-Type": "application/json",
      "X-CLI-Version": pkg.version,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return client;
};

export const api = {
  login: async (email?: string, password?: string, apiKey?: string) => {
    const response = await getClient().post("/auth/cli-login", {
      email,
      password,
      apiKey,
    });
    return response.data;
  },
  // Placeholders for future methods
  getSecrets: async (projectId: string, env: string, branch: string = "main", passphrase?: string) => {
     const response = await getClient().get(`/projects/${projectId}/envs/${env}/secrets?branch=${branch}`);
     const secrets = response.data;
     
     if (secrets && typeof secrets === 'object') {
       let projectKey: string | null = null;
       const { deriveProjectKey, decryptSecretValue, resolveVaultPassphrase } = require("./crypto");

       for (const [k, v] of Object.entries(secrets)) {
         if (typeof v === 'string' && v.startsWith('{')) {
           try {
             const parsed = JSON.parse(v);
             if (parsed.ciphertext && parsed.iv) {
               if (!projectKey) {
                 const activePassphrase = resolveVaultPassphrase(passphrase, projectId);
                 projectKey = deriveProjectKey(projectId, activePassphrase);
               }
               secrets[k] = decryptSecretValue(parsed, projectKey);
             }
           } catch (err: any) {
             // If JSON parse fails, it's just a string that happens to start with {
             // If resolveVaultPassphrase or decryptSecretValue throws, we should fail loudly!
             if (err.message && err.message.includes('Zero-Knowledge')) {
               throw err;
             }
           }
         }
       }
     }
     
     return secrets;
  },
  getSecretVersions: async (projectId: string, env: string, branch: string = "main") => {
      const response = await getClient().get(`/projects/${projectId}/envs/${env}/secrets?includeVersions=true&branch=${branch}`);
      return response.data;
  },
  setSecrets: async (projectId: string, env: string, secrets: Record<string, string>, expectedVersions?: Record<string, string>, branch: string = "main") => {
      // Zero-Knowledge E2EE: Encrypt plaintext before sending
      const { deriveProjectKey, encryptSecretValue, resolveVaultPassphrase } = require("./crypto");
      const activePassphrase = resolveVaultPassphrase(undefined, projectId);
      const projectKey = deriveProjectKey(projectId, activePassphrase);

      const encryptedSecrets: Record<string, string> = {};
      for (const [key, val] of Object.entries(secrets)) {
        if (typeof val === "string" && val.startsWith("{") && val.includes("ciphertext")) {
          encryptedSecrets[key] = val; // Already encrypted
        } else {
          const enc = encryptSecretValue(val, projectKey);
          encryptedSecrets[key] = JSON.stringify(enc);
        }
      }

      const response = await getClient().post(`/projects/${projectId}/envs/${env}/secrets`, { secrets: encryptedSecrets, expectedVersions, branch });
      return response.data;
  },
  getSecretDetails: async (projectId: string, env: string, key: string, branch: string = "main") => {
      const response = await getClient().get(`/projects/${projectId}/envs/${env}/secrets/${key}?branch=${branch}`);
      return response.data;
  },
  // Phase 3: Zero-Knowledge E2EE endpoints
  getSecretsV2: async (projectId: string, branchId?: string) => {
    const branchParam = branchId ? `&branchId=${branchId}` : "";
    const response = await getClient().get(`/v2/secret?projectId=${projectId}${branchParam}`);
    return response.data;
  },
  createSecretV2: async (payload: {
    key: string;
    ciphertext: string;
    iv: string;
    authTag: string;
    projectId: string;
    environmentType: string;
    branchId?: string;
    description?: string;
  }) => {
    const response = await getClient().post("/v2/secret", payload);
    return response.data;
  },
  updateSecretV2: async (payload: {
    id: string;
    ciphertext: string;
    iv: string;
    authTag: string;
    description?: string;
    environmentType?: string;
    changeReason?: string;
  }) => {
    const response = await getClient().put(`/v2/secret?id=${payload.id}`, payload);
    return response.data;
  },
  deleteSecretV2: async (secretId: string) => {
    const response = await getClient().delete(`/v2/secret?id=${secretId}`);
    return response.data;
  },
  bulkImportV2: async (payload: {
    projectId: string;
    branchId?: string;
    secrets: Array<{
      key: string;
      ciphertext: string;
      iv: string;
      authTag: string;
      environmentType?: string;
      description?: string;
    }>;
  }) => {
    const response = await getClient().post("/v2/secret/bulk", payload);
    return response.data;
  },
  syncLogs: async (logs: any[]) => {
      const response = await getClient().post("/audit/cli-logs", { logs });
      return response.data;
  },
  linkSecret: async (projectId: string, env: string, key: string, sourceProjectId: string, sourceEnv: string, sourceKey: string) => {
      const response = await getClient().post(`/projects/${projectId}/envs/${env}/secrets/link`, {
          key,
          sourceProjectId,
          sourceEnv,
          sourceKey
      });
      return response.data;
  },
  rotateSecret: async (projectId: string, env: string, key: string, strategy: string, parsedNewValue?: string) => {
      const response = await getClient().post(`/projects/${projectId}/envs/${env}/secrets/${key}/rotate`, {
          strategy,
          parsedNewValue
      });
      return response.data;
  },
  promoteSecret: async (projectId: string, env: string, key: string) => {
      const response = await getClient().post(`/projects/${projectId}/envs/${env}/secrets/${key}/promote`, {});
      return response.data;
  },
  verifyAuditLogs: async () => {
      const response = await getClient().get("/audit/verify");
      return response.data;
  },
  exportAuditLogs: async (format: "json" | "csv", start?: string, end?: string, projectId?: string) => {
      const body: any = { format };
      if (start) body.startDate = start;
      if (end) body.endDate = end;
      if (projectId) body.projectId = projectId;

      const response = await getClient().post("/audit/export", body, { responseType: format === "csv" ? "text" : "json" });
      return response.data;
  },
  // JIT Access
  requestAccess: async (projectId: string, reason: string, duration: number, secretId?: string) => {
      const response = await getClient().post("/access/request", { projectId, secretId, reason, duration });
      return response.data;
  },
  approveAccess: async (requestId: string, decision: "approved" | "rejected") => {
      const response = await getClient().post("/access/approve", { requestId, decision });
      return response.data;
  },
  listAccessRequests: async (mode: "my" | "pending") => {
      const { workspace } = getConfig();
      const workspaceParam = workspace ? `&workspaceId=${workspace}` : "";
      const response = await getClient().get(`/access/list?mode=${mode}${workspaceParam}`);
      return response.data;
  },
  getAccessRequestStatus: async (requestId: string) => {
      const response = await getClient().get(`/access/request?id=${requestId}`);
      return response.data;
  },
  // Project Management
  getProjects: async () => {
      const { workspace } = getConfig();
      const url = workspace ? `/project?workspaceId=${workspace}` : "/project";
      const response = await getClient().get(url);
      return response.data;
  },
  // Branch Management
  getBranches: async (projectId: string) => {
      const response = await getClient().get(`/branch?projectId=${projectId}`);
      return response.data;
  },
  createBranch: async (projectId: string, name: string, description?: string) => {
      const response = await getClient().post("/branch", { projectId, name, description });
      return response.data;
  },
  deleteBranch: async (branchId: string) => {
     const response = await getClient().delete(`/branch/${branchId}`);
     return response.data;
  },
  updateBranch: async (branchId: string, updates: { name?: string, description?: string }) => {
      const response = await getClient().put("/branch", { id: branchId, ...updates });
      return response.data;
  },
  // Admin - Role Management
  getRoles: async () => {
      const response = await getClient().get("/admin/roles");
      return response.data;
  },
  getUsers: async (teamId?: string) => {
      const params = teamId ? `?teamId=${teamId}` : "";
      const response = await getClient().get(`/admin/users${params}`);
      return response.data;
  },
  setUserRole: async (email: string, role: string, teamId?: string) => {
      const response = await getClient().put("/admin/users/role", { email, role, teamId });
      return response.data;
  },
  // Integrations
  getIntegrationStatus: async (provider: string) => {
    const response = await getClient().get(`/integrations/${provider}`);
    return response.data;
  },
  getIntegrationRepos: async (provider: string) => {
    const response = await getClient().get(`/integrations/${provider}/sync`);
    return response.data.repos;
  },
  syncSecretsToGithub: async (data: { projectId: string; environment: string; repoOwner: string; repoName: string; secretPrefix?: string }) => {
    const response = await getClient().post("/integrations/github/sync", data);
    return response.data;
  },
  exportKubernetesSecret: async (projectId: string, params: { environment: string; namespace?: string; name?: string; format?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    const response = await getClient().get(`/projects/${projectId}/kubernetes?${query}`);
    return response.data; // This returns the YAML string directly
  },
  
  // Advanced Features
  getSecretHistory: async (projectId: string, env: string, key: string) => {
    const response = await getClient().get(`/projects/${projectId}/envs/${env}/secrets/${key}/history`);
    return response.data;
  },
  rollbackSecret: async (projectId: string, env: string, key: string, version: string) => {
    const response = await getClient().post(`/projects/${projectId}/envs/${env}/secrets/${key}/history`, { version });
    return response.data;
  },
  cloneEnvironment: async (projectId: string, fromEnv: string, toEnv: string, overwrite: boolean, branch?: string) => {
    const response = await getClient().post(`/projects/${projectId}/envs/clone`, { fromEnv, toEnv, overwrite, branch });
    return response.data;
  },

  // JIT Link Management
  generateJitLink: async (opts: {
    projectId: string;
    branchId?: string;
    environment?: string;
    secretIds?: string[];
    duration: number;
    label?: string;
    maxUses?: number;
    expiresInHours?: number;
  }) => {
    const response = await getClient().post("/jit/generate", opts);
    return response.data;
  },
  claimJitLink: async (token: string) => {
    const response = await getClient().post("/jit/claim", { token });
    return response.data;
  },
  getJitInfo: async (token: string) => {
    const response = await getClient().get(`/jit/${token}`);
    return response.data;
  },
  
  // Service Account Management
  getServiceAccounts: async (projectId: string) => {
    const response = await getClient().get(`/projects/${projectId}/service-accounts`);
    return response.data;
  },
  createServiceAccount: async (projectId: string, data: { name: string, description?: string, permissions?: string[] }) => {
    const response = await getClient().post(`/projects/${projectId}/service-accounts`, data);
    return response.data;
  },
  deleteServiceAccount: async (projectId: string, saId: string) => {
    const response = await getClient().delete(`/projects/${projectId}/service-accounts/${saId}`);
    return response.data;
  },
  getServiceAccountKeys: async (projectId: string, saId: string) => {
    const response = await getClient().get(`/projects/${projectId}/service-accounts/${saId}/keys`);
    return response.data;
  },
  createServiceAccountKey: async (projectId: string, saId: string, label: string, expiresAt?: string) => {
    const response = await getClient().post(`/projects/${projectId}/service-accounts/${saId}/keys`, { label, expiresAt });
    return response.data;
  },
  deleteServiceAccountKey: async (projectId: string, saId: string, keyId: string) => {
    const response = await getClient().delete(`/projects/${projectId}/service-accounts/${saId}/keys/${keyId}`);
    return response.data;
  },

  // Generic POST method for audit logging and other uses
  post: async (endpoint: string, data: any) => {
    const response = await getClient().post(endpoint, data);
    return response.data;
  }
};

