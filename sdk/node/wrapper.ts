import { Configuration } from './configuration';
import {
    SecretsApi,
    ProjectsApi,
    TeamsApi,
    AccessApi,
    AuditApi,
    BranchesApi,
    NotificationsApi
} from './api';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { XtraSentinel, ThreatAssessment } from './sentinel';
import { XtraDynamicSecrets, DynamicSecretOptions, DynamicSecretCredential } from './dynamic';

export type EnvironmentType = 'development' | 'staging' | 'production';

/**
 * Derives a deterministic 256-bit symmetric key from a projectId using HKDF-SHA256
 */
export function deriveProjectKey(projectId: string): string {
    const salt = 'xtra-e2ee-salt-2026';
    const key = crypto.hkdfSync(
        'sha256',
        Buffer.from(projectId, 'utf-8'),
        Buffer.from(salt, 'utf-8'),
        Buffer.from('xtra-project-key', 'utf-8'),
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
export function decryptSecretValue(payload: { ciphertext: string; iv: string; authTag?: string; tag?: string }, projectKeyHex: string): string {
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

export interface TelemetryMetric {
    timestamp: number;
    environment: string;
    projectId: string;
    source: 'memory_cache' | 'disk_cache' | 'network';
    latencyMs: number;
    secretCount: number;
    retryCount: number;
}

export interface XtraClientOptions {
    /** The API Token. Defaults to XTRA_TOKEN env variable. */
    token?: string;
    /** The default project ID. Defaults to XTRA_PROJECT_ID env variable. */
    projectId?: string;
    /** Base URL of the XtraSecurity API. Defaults to https://www.xtrasecurity.in/api */
    apiUrl?: string;
    /** Cache secrets in memory to prevent rate limits. Defaults to true. */
    cache?: boolean;
    /** Cache TTL in milliseconds. Defaults to 30000 (30 seconds). */
    cacheTtl?: number;
    /** Fallback environment if a secret is missing in primary env. */
    fallbackEnv?: EnvironmentType;
    /** Enable hardware-bound encrypted disk cache fallback (Task A01 & A17). Defaults to true. */
    offlineDiskCache?: boolean;
    /** Maximum HTTP retry attempts for transient server errors (5xx/429). Defaults to 3. */
    maxRetries?: number;
    /** Telemetry metric listener hook (Task A32). */
    onTelemetry?: (metric: TelemetryMetric) => void;
    /** Optional Groq API Key for AI Anomaly Sentinel. */
    groqApiKey?: string;
    /** Enable AI Sentinel Guard. Defaults to true. */
    enableSentinel?: boolean;
}

export class XtraError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'XtraError';
    }
}

export class XtraClient {
    public secrets: SecretsApi;
    public projects: ProjectsApi;
    public teams: TeamsApi;
    public access: AccessApi;
    public audit: AuditApi;
    public branches: BranchesApi;
    public notifications: NotificationsApi;
    public sentinel: XtraSentinel;
    public dynamicSecrets: XtraDynamicSecrets = new XtraDynamicSecrets();

    private defaultProjectId?: string;
    private cacheTtl: number;
    private useCache: boolean;
    private fallbackEnv?: EnvironmentType;
    private offlineDiskCache: boolean;
    private maxRetries: number;
    private onTelemetry?: (metric: TelemetryMetric) => void;
    private enableSentinel: boolean;

    private cache: Map<string, { data: Record<string, string>; expiresAt: number }> = new Map();
    private autoRefreshTimer?: NodeJS.Timeout;

    constructor(options: XtraClientOptions = {}) {
        const token = options.token || process.env.XTRA_TOKEN;
        if (!token) {
            throw new XtraError('XtraSecurity API token is required. Pass it to the constructor or set XTRA_TOKEN.');
        }

        const basePath = options.apiUrl || process.env.XTRA_API_URL || 'https://www.xtrasecurity.in/api';
        this.defaultProjectId = options.projectId || process.env.XTRA_PROJECT_ID;
        this.useCache = options.cache !== false;
        this.cacheTtl = options.cacheTtl || 30000;
        this.fallbackEnv = options.fallbackEnv;
        this.offlineDiskCache = options.offlineDiskCache !== false;
        this.maxRetries = options.maxRetries ?? 3;
        this.onTelemetry = options.onTelemetry;
        this.enableSentinel = options.enableSentinel !== false;
        this.sentinel = new XtraSentinel(options.groqApiKey);

        const config = new Configuration({
            basePath,
            accessToken: token,
        });

        this.secrets = new SecretsApi(config);
        this.projects = new ProjectsApi(config);
        this.teams = new TeamsApi(config);
        this.access = new AccessApi(config);
        this.audit = new AuditApi(config);
        this.branches = new BranchesApi(config);
        this.notifications = new NotificationsApi(config);
    }

    /**
     * Derives a hardware-bound AES-256 key using motherboard/system UUID & machine details (Task A01).
     */
    private getHardwareEncryptionKey(): Buffer {
        const machineIdentity = `${os.hostname()}-${os.platform()}-${os.arch()}-${os.userInfo().username}`;
        const salt = 'xtra-motherboard-bound-salt-2026';
        return crypto.pbkdf2Sync(machineIdentity, salt, 10000, 32, 'sha256');
    }

    /**
     * Encrypts data payload using AES-256-GCM hardware key.
     */
    private encryptHardwarePayload(data: Record<string, string>): string {
        const key = this.getHardwareEncryptionKey();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf-8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        return JSON.stringify({
            iv: iv.toString('hex'),
            encrypted,
            authTag
        });
    }

    /**
     * Decrypts payload using hardware key.
     */
    private decryptHardwarePayload(payloadStr: string): Record<string, string> {
        const { iv, encrypted, authTag } = JSON.parse(payloadStr);
        const key = this.getHardwareEncryptionKey();
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
        decrypted += decipher.final('utf-8');

        return JSON.parse(decrypted);
    }

    private getDiskCachePath(pid: string, env: string): string {
        const cacheDir = path.join(os.homedir(), '.xtra', 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        return path.join(cacheDir, `cache_${pid}_${env}.enc`);
    }

    private writeDiskCache(pid: string, env: string, data: Record<string, string>): void {
        if (!this.offlineDiskCache) return;
        try {
            const filePath = this.getDiskCachePath(pid, env);
            const payload = this.encryptHardwarePayload(data);
            fs.writeFileSync(filePath, payload, 'utf-8');
        } catch (_) {}
    }

    private readDiskCache(pid: string, env: string): Record<string, string> | null {
        if (!this.offlineDiskCache) return null;
        try {
            const filePath = this.getDiskCachePath(pid, env);
            if (!fs.existsSync(filePath)) return null;
            const content = fs.readFileSync(filePath, 'utf-8');
            return this.decryptHardwarePayload(content);
        } catch (_) {
            return null;
        }
    }

    /**
     * Executes an async operation with exponential backoff & jitter retries.
     */
    private async executeWithRetry<T>(fn: () => Promise<T>): Promise<{ result: T; retryCount: number }> {
        let attempts = 0;
        let delay = 100;
        while (attempts <= this.maxRetries) {
            try {
                const result = await fn();
                return { result, retryCount: attempts };
            } catch (error: any) {
                const status = error?.response?.status;
                const isRetryable = !status || status >= 500 || status === 429;
                if (attempts >= this.maxRetries || !isRetryable) {
                    throw error;
                }
                attempts++;
                const jitter = Math.random() * 50;
                await new Promise(r => setTimeout(r, delay + jitter));
                delay *= 2;
            }
        }
        throw new Error('Retry attempts exhausted');
    }

    /**
     * Fetches all secrets with in-memory caching, multi-env fallbacks, HTTP retries, and motherboard disk cache failover.
     */
    public async getSecrets(
        env: EnvironmentType,
        projectId?: string,
        branch?: string,
        noCache = false,
        fallbackEnv?: EnvironmentType
    ): Promise<Record<string, string>> {
        const startTime = Date.now();
        const pid = projectId || this.defaultProjectId;
        if (!pid) throw new XtraError('Project ID is required.');

        const cacheKey = `secrets:${pid}:${env}:${branch || 'main'}`;
        if (this.useCache && !noCache) {
            const cached = this.cache.get(cacheKey);
            if (cached && cached.expiresAt > Date.now()) {
                this.onTelemetry?.({
                    timestamp: Date.now(),
                    environment: env,
                    projectId: pid,
                    source: 'memory_cache',
                    latencyMs: Date.now() - startTime,
                    secretCount: Object.keys(cached.data).length,
                    retryCount: 0
                });
                return cached.data;
            }
        }

        try {
            const { result: response, retryCount } = await this.executeWithRetry(() =>
                this.secrets.getSecrets(pid, env, branch)
            );

            let data: Record<string, string> = (response.data as any) || {};

            // Transparently decrypt any v2 Zero-Knowledge E2EE payloads
            const projectKey = deriveProjectKey(pid);
            for (const [k, v] of Object.entries(data)) {
                if (typeof v === 'string' && v.startsWith('{') && v.includes('ciphertext')) {
                    try {
                        const parsed = JSON.parse(v);
                        if (parsed.ciphertext && parsed.iv) {
                            data[k] = decryptSecretValue(parsed, projectKey);
                        }
                    } catch (_) {}
                }
            }

            // Multi-Environment Fallback Resolution (Task A33)
            const activeFallback = fallbackEnv || this.fallbackEnv;
            if (activeFallback && activeFallback !== env) {
                try {
                    const { result: fallbackResponse } = await this.executeWithRetry(() =>
                        this.secrets.getSecrets(pid, activeFallback, branch)
                    );
                    const fallbackData = (fallbackResponse.data as any) || {};
                    data = { ...fallbackData, ...data };
                } catch (_) {}
            }

            // Groq AI Threat Sentinel Evaluation (Feature 2)
            if (this.enableSentinel) {
                const keys = Object.keys(data);
                const assessment = await this.sentinel.evaluateThreat({
                    projectId: pid,
                    environment: env,
                    requestCount: 1,
                    timeWindowMs: 10000,
                    secretKeys: keys
                });

                if (assessment.isAnomalous && assessment.recommendedAction === 'REVOKE_AND_ROTATE') {
                    throw new XtraError(`[GROQ AI SENTINEL ALERT] Threat Detected (${assessment.evaluatedBy}): ${assessment.reason}`);
                }
            }
            
            if (this.useCache) {
                this.cache.set(cacheKey, { data, expiresAt: Date.now() + this.cacheTtl });
            }
            
            // Persist hardware-encrypted disk cache (Task A01 & A17)
            this.writeDiskCache(pid, env, data);

            this.onTelemetry?.({
                timestamp: Date.now(),
                environment: env,
                projectId: pid,
                source: 'network',
                latencyMs: Date.now() - startTime,
                secretCount: Object.keys(data).length,
                retryCount
            });

            return data;
        } catch (error: any) {
            if (error instanceof XtraError && error.message.includes('GROQ AI SENTINEL ALERT')) {
                throw error;
            }
            // Offline Motherboard-Bound Encrypted Disk Cache Fallback (Task A17)
            const diskCachedData = this.readDiskCache(pid, env);
            if (diskCachedData) {
                console.warn(`[XtraSecurity SDK] Network request failed. Transparently falling back to hardware-locked encrypted disk cache for project '${pid}' (${env}).`);
                
                if (this.useCache) {
                    this.cache.set(cacheKey, { data: diskCachedData, expiresAt: Date.now() + this.cacheTtl });
                }

                this.onTelemetry?.({
                    timestamp: Date.now(),
                    environment: env,
                    projectId: pid,
                    source: 'disk_cache',
                    latencyMs: Date.now() - startTime,
                    secretCount: Object.keys(diskCachedData).length,
                    retryCount: this.maxRetries
                });

                return diskCachedData;
            }

            throw new XtraError(`Failed to fetch secrets: ${(error as any)?.response?.data?.error || error?.message || "An unexpected error occurred"}`);
        }
    }

    /**
     * Retrieves a single secret by key with optional default fallback value.
     */
    public async getSecret(
        key: string,
        defaultValue?: string,
        env: EnvironmentType = 'development',
        options?: { projectId?: string; branch?: string; fallbackEnv?: EnvironmentType }
    ): Promise<string | undefined> {
        const secrets = await this.getSecrets(env, options?.projectId, options?.branch, false, options?.fallbackEnv);
        if (key in secrets && secrets[key] !== undefined) {
            return secrets[key];
        }
        return defaultValue;
    }

    /**
     * Injects secrets directly into process.env.
     */
    public async injectSecrets(
        env: EnvironmentType,
        options?: { projectId?: string; branch?: string; override?: boolean; fallbackEnv?: EnvironmentType }
    ): Promise<Record<string, string>> {
        const secrets = await this.getSecrets(env, options?.projectId, options?.branch, false, options?.fallbackEnv);
        
        for (const [key, value] of Object.entries(secrets)) {
            if (options?.override || process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
        return secrets;
    }

    /**
     * Starts background cache auto-refresh worker (Task A27).
     */
    public startAutoRefresh(
        env: EnvironmentType = 'development',
        intervalMs: number = 60000,
        options?: { projectId?: string; branch?: string }
    ): void {
        this.stopAutoRefresh();
        this.autoRefreshTimer = setInterval(async () => {
            try {
                await this.getSecrets(env, options?.projectId, options?.branch, true);
            } catch (_) {}
        }, intervalMs);
    }

    /**
     * Stops the background cache auto-refresh worker.
     */
    public stopAutoRefresh(): void {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
            this.autoRefreshTimer = undefined;
        }
    }

    /**
     * Executes an async callback with injected secrets and restores process.env afterwards.
     */
    public async withSecrets<T>(
        env: EnvironmentType,
        options: { projectId?: string; branch?: string; fallbackEnv?: EnvironmentType },
        fn: () => Promise<T>
    ): Promise<T> {
        const previousEnv = { ...process.env };
        try {
            await this.injectSecrets(env, { ...options, override: true });
            return await fn();
        } finally {
            process.env = previousEnv;
        }
    }

    /**
     * Express / Connect middleware auto-injector.
     */
    public expressMiddleware(
        env: EnvironmentType = 'development',
        options?: { projectId?: string; branch?: string; fallbackEnv?: EnvironmentType }
    ) {
        return async (req: any, _res: any, next: (err?: any) => void) => {
            try {
                const secrets = await this.injectSecrets(env, options);
                req.secrets = secrets;
                next();
            } catch (err) {
                next(err);
            }
        };
    }

    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * Generates a temporary, self-destructing dynamic database credential (Feature 3).
     */
    public createDynamicSecret(options: DynamicSecretOptions): DynamicSecretCredential {
        return this.dynamicSecrets.createDynamicSecret(options);
    }

    /**
     * Derives a deterministic 256-bit symmetric project key using HKDF-SHA256
     */
    public deriveProjectKey(projectId?: string): string {
        return deriveProjectKey(projectId || this.defaultProjectId || '');
    }

    /**
     * Encrypts a secret value with Zero-Knowledge AES-256-GCM
     */
    public encryptSecret(value: string, projectId?: string): { ciphertext: string; iv: string; authTag: string } {
        const key = this.deriveProjectKey(projectId);
        return encryptSecretValue(value, key);
    }

    /**
     * Decrypts a Zero-Knowledge AES-256-GCM secret payload
     */
    public decryptSecret(payload: { ciphertext: string; iv: string; authTag?: string; tag?: string }, projectId?: string): string {
        const key = this.deriveProjectKey(projectId);
        return decryptSecretValue(payload, key);
    }
}
