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

    private defaultProjectId?: string;
    private cacheTtl: number;
    private useCache: boolean;
    private cache: Map<string, { data: any; expiresAt: number }> = new Map();

    constructor(options: XtraClientOptions = {}) {
        const token = options.token || process.env.XTRA_TOKEN;
        if (!token) {
            throw new XtraError('XtraSecurity API token is required. Pass it to the constructor or set XTRA_TOKEN.');
        }

        const basePath = options.apiUrl || process.env.XTRA_API_URL || 'https://www.xtrasecurity.in/api';
        this.defaultProjectId = options.projectId || process.env.XTRA_PROJECT_ID;
        this.useCache = options.cache !== false;
        this.cacheTtl = options.cacheTtl || 30000;

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
     * Fetches all secrets for an environment and optionally caches them.
     */
    public async getSecrets(
        env: 'development' | 'staging' | 'production',
        projectId?: string,
        branch?: string,
        noCache = false
    ): Promise<Record<string, string>> {
        const pid = projectId || this.defaultProjectId;
        if (!pid) throw new XtraError('Project ID is required.');

        const cacheKey = `secrets:${pid}:${env}:${branch || 'main'}`;
        if (this.useCache && !noCache) {
            const cached = this.cache.get(cacheKey);
            if (cached && cached.expiresAt > Date.now()) {
                return cached.data;
            }
        }

        try {
            // The generated API returns an AxiosResponse
            const response = await this.secrets.getSecrets(pid, env, branch);
            const data = response.data;
            
            if (this.useCache) {
                this.cache.set(cacheKey, { data, expiresAt: Date.now() + this.cacheTtl });
            }
            return data;
        } catch (error: any) {
            throw new XtraError(`Failed to fetch secrets: ${error.message}`);
        }
    }

    /**
     * Injects secrets directly into process.env.
     */
    public async injectSecrets(
        env: 'development' | 'staging' | 'production',
        options?: { projectId?: string; branch?: string; override?: boolean }
    ): Promise<void> {
        const secrets = await this.getSecrets(env, options?.projectId, options?.branch);
        
        for (const [key, value] of Object.entries(secrets)) {
            if (options?.override || process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
    }

    public clearCache(): void {
        this.cache.clear();
    }
}
