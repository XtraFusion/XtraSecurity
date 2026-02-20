
// ─────────────────────────────────────────────────────────────────────────────
// XtraSecurity Node.js SDK
// Full-featured client for programmatic access to secrets and projects.
// ─────────────────────────────────────────────────────────────────────────────

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface XtraClientOptions {
  /** Your API token. Falls back to XTRA_TOKEN env var or local config file. */
  token?: string;
  /** Your project ID. Falls back to XTRA_PROJECT_ID env var. */
  projectId?: string;
  /** The base URL of your XtraSecurity API. Defaults to production. */
  apiUrl?: string;
  /** Cache secrets in memory to reduce API calls. Defaults to true. */
  cache?: boolean;
  /** Cache TTL in milliseconds. Defaults to 30 seconds. */
  cacheTtl?: number;
}

export interface SecretDetail {
  value: string;
  version: string;
  isReference?: boolean;
  source?: 'local' | 'linked';
}

export type SecretsMap = Record<string, string>;
export type DetailedSecretsMap = Record<string, SecretDetail>;

export class XtraError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'XtraError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class XtraClient {
  private api: AxiosInstance;
  private projectId: string;
  private cacheTtl: number;
  private useCache: boolean;
  private secretsCache: Map<string, CacheEntry<SecretsMap>> = new Map();

  constructor(options: XtraClientOptions = {}) {
    const token = options.token ?? process.env.XTRA_TOKEN ?? this.loadLocalToken();
    const apiUrl = options.apiUrl ?? process.env.XTRA_API_URL ?? 'https://xtrasecurity.dev/api';
    this.projectId = options.projectId ?? process.env.XTRA_PROJECT_ID ?? '';
    this.useCache = options.cache !== false;
    this.cacheTtl = options.cacheTtl ?? 30_000; // 30s default

    if (!token) {
      throw new XtraError(
        'No API token provided. Pass `token` in options, set the XTRA_TOKEN env var, or run `xtra login`.',
        0,
        'MISSING_TOKEN'
      );
    }

    if (!this.projectId) {
      console.warn('[XtraClient] No projectId provided. You must pass projectId to each method, or set XTRA_PROJECT_ID.');
    }

    this.api = axios.create({
      baseURL: apiUrl,
      timeout: 10_000,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-SDK-Version': '0.2.0',
        'X-SDK-Language': 'node',
      },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SECRETS
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Fetch all secrets for an environment as a key-value map.
   *
   * @param env - The environment name. One of 'development', 'staging', 'production'.
   * @param options.branch - The branch to read from. Defaults to 'main'.
   * @param options.projectId - Override the project ID.
   * @param options.noCache - Skip cache for this request.
   */
  async getAllSecrets(
    env: 'development' | 'staging' | 'production' | string = 'development',
    options: { branch?: string; projectId?: string; noCache?: boolean } = {}
  ): Promise<SecretsMap> {
    const projectId = this.resolveProjectId(options.projectId);
    const branch = options.branch ?? 'main';
    const cacheKey = `${projectId}:${env}:${branch}`;

    if (this.useCache && !options.noCache) {
      const cached = this.secretsCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    try {
      const res = await this.api.get<SecretsMap>(
        `/projects/${projectId}/envs/${env}/secrets`,
        { params: { branch } }
      );
      const data = res.data;

      if (this.useCache) {
        this.secretsCache.set(cacheKey, { data, expiresAt: Date.now() + this.cacheTtl });
      }

      return data;
    } catch (err) {
      throw this.wrapError(err, `Failed to get secrets for env '${env}'`);
    }
  }

  /**
   * Fetch a single secret value by key.
   *
   * @param key - The secret key (e.g., 'DATABASE_URL')
   * @param env - The environment name.
   * @param options.projectId - Override the project ID.
   */
  async getSecret(
    key: string,
    env: 'development' | 'staging' | 'production' | string = 'development',
    options: { branch?: string; projectId?: string } = {}
  ): Promise<string | null> {
    const all = await this.getAllSecrets(env, options);
    return all[key] ?? null;
  }

  /**
   * Inject all secrets from an environment into `process.env`.
   * Useful for bootstrapping app configuration.
   *
   * @param env - The environment to inject.
   * @param options.override - Whether to overwrite existing env vars. Defaults to false.
   */
  async injectSecrets(
    env: 'development' | 'staging' | 'production' | string = 'development',
    options: { override?: boolean; projectId?: string; branch?: string } = {}
  ): Promise<void> {
    const secrets = await this.getAllSecrets(env, options);
    for (const [key, value] of Object.entries(secrets)) {
      if (options.override || process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    console.log(`[XtraClient] Injected ${Object.keys(secrets).length} secrets from '${env}' into process.env.`);
  }

  /**
   * Create or update one or more secrets in bulk.
   *
   * @param secrets - A key-value map of secrets to upsert.
   * @param env - The target environment.
   * @param options.branch - The branch to write to. Defaults to 'main'.
   */
  async setSecrets(
    secrets: SecretsMap,
    env: 'development' | 'staging' | 'production' | string = 'development',
    options: { branch?: string; projectId?: string } = {}
  ): Promise<{ success: boolean; count: number }> {
    const projectId = this.resolveProjectId(options.projectId);
    const branch = options.branch ?? 'main';

    try {
      const res = await this.api.post<{ success: boolean; count: number }>(
        `/projects/${projectId}/envs/${env}/secrets`,
        { secrets, branch }
      );
      // Invalidate cache on write
      this.secretsCache.delete(`${projectId}:${env}:${branch}`);
      return res.data;
    } catch (err) {
      throw this.wrapError(err, `Failed to set secrets in env '${env}'`);
    }
  }

  /**
   * Create or update a single secret.
   *
   * @param key - The secret key.
   * @param value - The secret value.
   * @param env - The target environment.
   */
  async setSecret(
    key: string,
    value: string,
    env: 'development' | 'staging' | 'production' | string = 'development',
    options: { branch?: string; projectId?: string } = {}
  ): Promise<{ success: boolean; count: number }> {
    return this.setSecrets({ [key]: value }, env, options);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PROJECTS
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * List all projects accessible to the authenticated user.
   */
  async listProjects(): Promise<any[]> {
    try {
      const res = await this.api.get('/projects');
      return res.data;
    } catch (err) {
      throw this.wrapError(err, 'Failed to list projects');
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILITY
  // ───────────────────────────────────────────────────────────────────────────

  /** Clear the in-memory secrets cache. */
  clearCache(): void {
    this.secretsCache.clear();
  }

  private resolveProjectId(override?: string): string {
    const id = override ?? this.projectId;
    if (!id) {
      throw new XtraError(
        'projectId is required. Pass it in options or set XTRA_PROJECT_ID.',
        0,
        'MISSING_PROJECT_ID'
      );
    }
    return id;
  }

  private loadLocalToken(): string | undefined {
    try {
      const configPath = path.join(os.homedir(), '.xtra', 'config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return config.token;
      }
    } catch {
      // Config file not found or malformed — silently ignore
    }
    return undefined;
  }

  private wrapError(err: unknown, context: string): XtraError {
    if (err instanceof AxiosError) {
      const status = err.response?.status ?? 0;
      const serverMsg = err.response?.data?.error ?? err.response?.data?.message ?? err.message;
      const code = err.response?.data?.code ?? `HTTP_${status}`;
      return new XtraError(`${context}: ${serverMsg}`, status, code);
    }
    if (err instanceof XtraError) return err;
    return new XtraError(`${context}: ${String(err)}`, 0, 'UNKNOWN_ERROR');
  }
}

// All types are exported directly from their declarations above.
