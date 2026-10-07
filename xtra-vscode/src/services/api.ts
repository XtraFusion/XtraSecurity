import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface EncryptedPayload {
    ciphertext: string;
    iv: string;
    authTag?: string;
    tag?: string;
}

/**
 * Derives a deterministic 256-bit symmetric key from a projectId and user passphrase using HKDF-SHA256
 */
export function deriveProjectKey(projectId: string, userSecret: string = "xtra-zero-knowledge-master"): string {
    const salt = Buffer.from(`project_salt_${projectId}`);
    const info = Buffer.from('xtra-e2ee-project-key-v2');
    const key = crypto.hkdfSync(
        'sha256',
        Buffer.from(userSecret, 'utf-8'),
        salt,
        info,
        32
    );
    return Buffer.from(key).toString('hex');
}

/**
 * Encrypts a plaintext secret value using AES-256-GCM
 */
export function encryptSecretValue(plaintext: string, projectKeyHex: string): { ciphertext: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(12);
    const key = Buffer.from(projectKeyHex, 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ciphertext = cipher.update(plaintext, 'utf-8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return {
        ciphertext,
        iv: iv.toString('hex'),
        authTag
    };
}

/**
 * Decrypts an AES-256-GCM encrypted secret payload
 */
export function decryptSecretValue(payload: EncryptedPayload, projectKeyHex: string): string {
    const key = Buffer.from(projectKeyHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'hex'));
    const tag = payload.authTag || payload.tag;
    if (tag) {
        decipher.setAuthTag(Buffer.from(tag, 'hex'));
    }
    let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}

export class XtraApiService {
    private client: AxiosInstance;

    constructor(private context: vscode.ExtensionContext) {
        const apiUrl = vscode.workspace.getConfiguration('xtra').get<string>('apiUrl') || 'https://www.xtrasecurity.in/api';
        const version = context.extension.packageJSON.version || '1.0.0';
        
        this.client = axios.create({
            baseURL: apiUrl,
            headers: { 
                'Content-Type': 'application/json',
                'X-VSCode-Version': version
            }
        });
    }

    async setToken(token: string) {
        await this.context.secrets.store('xtra_api_token', token);
        this.updateHeaders(token);
    }

    async deleteToken() {
        await this.context.secrets.delete('xtra_api_token');
        delete this.client.defaults.headers.common['Authorization'];
    }

    async getToken(): Promise<string | undefined> {
        return await this.context.secrets.get('xtra_api_token');
    }

    async setVaultPassphrase(passphrase: string, projectId?: string): Promise<void> {
        const key = projectId ? `xtra_vault_passphrase_${projectId}` : 'xtra_vault_passphrase';
        await this.context.secrets.store(key, passphrase);
    }

    async getVaultPassphrase(projectId?: string): Promise<string | undefined> {
        if (projectId) {
            const projPass = await this.context.secrets.get(`xtra_vault_passphrase_${projectId}`);
            if (projPass) return projPass;
        }
        const globalPass = await this.context.secrets.get('xtra_vault_passphrase');
        if (globalPass) return globalPass;
        
        const configPass = vscode.workspace.getConfiguration('xtra').get<string>('vaultPassphrase');
        if (configPass) return configPass;

        return process.env.XTRA_VAULT_PASSPHRASE;
    }

    private updateHeaders(token: string) {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    async init() {
        const token = await this.getToken();
        if (token) {
            this.updateHeaders(token);
        }
    }

    async login(apiKey: string) {
        const response = await this.client.post('/auth/cli-login', { apiKey });
        return response.data;
    }

    async getProjects() {
        const response = await this.client.get('/project');
        return response.data;
    }

    async getBranches(projectId: string) {
        const response = await this.client.get(`/branch?projectId=${projectId}`);
        return response.data;
    }

    async getSecrets(projectId: string, env: string, branch: string = 'main') {
        const response = await this.client.get(`/projects/${projectId}/envs/${env}/secrets?branch=${branch}`);
        const secrets = response.data;
        
        if (secrets && typeof secrets === 'object') {
            let projectKey: string | null = null;
            
            for (const [k, v] of Object.entries(secrets)) {
                if (typeof v === 'string' && v.startsWith('{') && v.includes('ciphertext')) {
                    try {
                        const parsed = JSON.parse(v);
                        if (parsed.ciphertext && parsed.iv) {
                            if (!projectKey) {
                                const vaultPassphrase = await this.getVaultPassphrase(projectId);
                                projectKey = deriveProjectKey(projectId, vaultPassphrase);
                            }
                            secrets[k] = decryptSecretValue(parsed, projectKey);
                        }
                    } catch (err: any) {
                        if (err.message && err.message.includes('Zero-Knowledge')) {
                            throw err;
                        }
                    }
                }
            }
        }
        
        return secrets;
    }

    async requestAccess(projectId: string, reason: string, duration: number) {
        const response = await this.client.post('/access/request', { projectId, reason, duration });
        return response.data;
    }

    async getAccessRequests() {
        const response = await this.client.get('/access/list?mode=my');
        return response.data;
    }

    async setSecrets(projectId: string, env: string, secrets: Record<string, string>, branch: string = 'main') {
        const vaultPassphrase = await this.getVaultPassphrase(projectId);
        const projectKey = deriveProjectKey(projectId, vaultPassphrase);

        const encryptedSecrets: Record<string, string> = {};
        for (const [key, val] of Object.entries(secrets)) {
            if (typeof val === "string" && val.startsWith("{") && val.includes("ciphertext")) {
                encryptedSecrets[key] = val; // Already encrypted
            } else {
                const enc = encryptSecretValue(val, projectKey);
                encryptedSecrets[key] = JSON.stringify(enc);
            }
        }

        const response = await this.client.post(`/projects/${projectId}/envs/${env}/secrets?branch=${branch}`, { secrets: encryptedSecrets });
        return response.data;
    }

    async getAuditStats() {
        const response = await this.client.get('/audit/stats');
        return response.data;
    }

    // --- Phase 3: Zero-Knowledge E2EE v2 Methods ---

    async getSecretsV2(projectId: string, branchId?: string) {
        const url = `/v2/secret?projectId=${projectId}${branchId ? `&branchId=${branchId}` : ''}`;
        const response = await this.client.get(url);
        return response.data;
    }

    async createSecretV2(data: {
        key: string;
        ciphertext: string;
        iv: string;
        authTag: string;
        projectId: string;
        environmentType: string;
        branchId?: string;
        description?: string;
    }) {
        const response = await this.client.post('/v2/secret', data);
        return response.data;
    }

    async updateSecretV2(data: {
        id: string;
        ciphertext: string;
        iv: string;
        authTag: string;
        projectId: string;
        environmentType?: string;
        description?: string;
        changeReason?: string;
    }) {
        const response = await this.client.put(`/v2/secret?id=${data.id}`, data);
        return response.data;
    }

    async deleteSecretV2(secretId: string, projectId?: string) {
        const url = `/v2/secret?id=${secretId}${projectId ? `&projectId=${projectId}` : ''}`;
        const response = await this.client.delete(url);
        return response.data;
    }

    async bulkImportV2(projectId: string, secrets: any[], branchId?: string, environmentType: string = 'development') {
        const response = await this.client.post('/v2/secret/bulk', {
            projectId,
            branchId,
            environmentType,
            secrets
        });
        return response.data;
    }
}
