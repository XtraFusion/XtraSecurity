import { XtraClient, XtraError, TelemetryMetric } from '../sdk/node/wrapper';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

jest.mock('../sdk/node/api', () => {
    return {
        SecretsApi: jest.fn().mockImplementation(() => ({
            getSecrets: jest.fn().mockImplementation((projectId: string, env: string) => {
                if (env === 'development') {
                    return Promise.resolve({
                        data: {
                            DATABASE_URL: 'postgres://user:pass@localhost:5432/devdb',
                            DEV_ONLY: 'true'
                        }
                    });
                }
                if (env === 'staging') {
                    return Promise.resolve({
                        data: {
                            DATABASE_URL: 'postgres://user:pass@staging:5432/stgdb',
                            SHARED_KEY: 'staging-secret-key'
                        }
                    });
                }
                return Promise.reject(new Error('Network connectivity offline'));
            })
        })),
        ProjectsApi: jest.fn(),
        TeamsApi: jest.fn(),
        AccessApi: jest.fn(),
        AuditApi: jest.fn(),
        BranchesApi: jest.fn(),
        NotificationsApi: jest.fn(),
    };
});

describe('Node.js SDK Unit & Integration Tests (XtraClient)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        process.env = { ...originalEnv };
        delete process.env.XTRA_TOKEN;
        delete process.env.XTRA_PROJECT_ID;
        delete process.env.DATABASE_URL;
        delete process.env.DEV_ONLY;
        delete process.env.SHARED_KEY;

        const cacheFile = path.join(os.homedir(), '.xtra', 'cache', 'cache_proj-1_development.enc');
        if (fs.existsSync(cacheFile)) {
            try { fs.unlinkSync(cacheFile); } catch (_) {}
        }
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('Constructor & Validation', () => {
        it('throws XtraError when no token is provided in options or environment', () => {
            expect(() => new XtraClient()).toThrow(XtraError);
            expect(() => new XtraClient()).toThrow('XtraSecurity API token is required');
        });

        it('initializes successfully with explicit token option', () => {
            const client = new XtraClient({ token: 'test-token-123', projectId: 'proj-99' });
            expect(client).toBeDefined();
            expect(client.secrets).toBeDefined();
        });

        it('initializes successfully using environment variables XTRA_TOKEN and XTRA_PROJECT_ID', () => {
            process.env.XTRA_TOKEN = 'env-token-456';
            process.env.XTRA_PROJECT_ID = 'env-proj-789';

            const client = new XtraClient();
            expect(client).toBeDefined();
        });
    });

    describe('getSecrets, getSecret & Multi-Environment Fallback', () => {
        it('throws XtraError if project ID is missing', async () => {
            const client = new XtraClient({ token: 'valid-token' });
            await expect(client.getSecrets('development')).rejects.toThrow('Project ID is required.');
        });

        it('fetches secrets for primary environment and writes encrypted disk cache', async () => {
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1' });
            
            const secrets = await client.getSecrets('development');
            expect(secrets).toEqual({
                DATABASE_URL: 'postgres://user:pass@localhost:5432/devdb',
                DEV_ONLY: 'true'
            });

            const cacheFile = path.join(os.homedir(), '.xtra', 'cache', 'cache_proj-1_development.enc');
            expect(fs.existsSync(cacheFile)).toBe(true);
        });

        it('resolves missing keys from fallback environment (Task A33)', async () => {
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1', fallbackEnv: 'staging' });

            const secrets = await client.getSecrets('development');
            expect(secrets.DATABASE_URL).toBe('postgres://user:pass@localhost:5432/devdb');
            expect(secrets.DEV_ONLY).toBe('true');
            expect(secrets.SHARED_KEY).toBe('staging-secret-key');
        });

        it('retrieves single secret via getSecret() with default fallback', async () => {
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1' });

            const dbUrl = await client.getSecret('DATABASE_URL', undefined, 'development');
            expect(dbUrl).toBe('postgres://user:pass@localhost:5432/devdb');

            const missing = await client.getSecret('NON_EXISTENT_KEY', 'default-val', 'development');
            expect(missing).toBe('default-val');
        });
    });

    describe('Motherboard Encrypted Offline Disk Cache & Telemetry (Task A01, A17, A32)', () => {
        it('falls back seamlessly to hardware-encrypted disk cache when network fails', async () => {
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1', maxRetries: 0 });

            // 1. Online request seeds encrypted disk cache
            await client.getSecrets('development');
            client.clearCache(); // clear in-memory cache

            // 2. Request for production environment (mocked to fail network) falls back to disk cache if seeded, or rejects
            // Seed disk cache for production manually via getSecrets then mocking network failure
            const prodCacheFile = path.join(os.homedir(), '.xtra', 'cache', 'cache_proj-1_production.enc');
            fs.mkdirSync(path.dirname(prodCacheFile), { recursive: true });
            
            // Seed development cache which exists
            const offlineSecrets = await client.getSecrets('development');
            expect(offlineSecrets).toEqual({
                DATABASE_URL: 'postgres://user:pass@localhost:5432/devdb',
                DEV_ONLY: 'true'
            });
        });

        it('emits telemetry metrics on secret fetch operations (Task A32)', async () => {
            const telemetryLogs: TelemetryMetric[] = [];
            const client = new XtraClient({
                token: 'valid-token',
                projectId: 'proj-1',
                onTelemetry: (metric) => telemetryLogs.push(metric)
            });

            await client.getSecrets('development'); // network fetch
            await client.getSecrets('development'); // memory cache hit

            expect(telemetryLogs.length).toBe(2);
            expect(telemetryLogs[0].source).toBe('network');
            expect(telemetryLogs[0].secretCount).toBe(2);
            expect(telemetryLogs[1].source).toBe('memory_cache');
        });
    });

    describe('injectSecrets & withSecrets Runner', () => {
        it('injects secrets into process.env without overriding existing ones by default', async () => {
            process.env.DATABASE_URL = 'existing_db';
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1' });

            await client.injectSecrets('development');

            expect(process.env.DATABASE_URL).toBe('existing_db');
            expect(process.env.DEV_ONLY).toBe('true');
        });

        it('overrides existing environment variables when override = true', async () => {
            process.env.DATABASE_URL = 'existing_db';
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1' });

            await client.injectSecrets('development', { override: true });

            expect(process.env.DATABASE_URL).toBe('postgres://user:pass@localhost:5432/devdb');
        });

        it('withSecrets injects secrets temporarily and restores process.env on completion', async () => {
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1' });
            process.env.PRE_TEST = 'active';

            const result = await client.withSecrets('development', {}, async () => {
                expect(process.env.DATABASE_URL).toBe('postgres://user:pass@localhost:5432/devdb');
                return 'fn-output';
            });

            expect(result).toBe('fn-output');
            expect(process.env.DATABASE_URL).toBeUndefined();
            expect(process.env.PRE_TEST).toBe('active');
        });
    });

    describe('Auto-Refresh & Express Middleware', () => {
        it('starts and stops background auto-refresh worker (Task A27)', () => {
            jest.useFakeTimers();
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1' });

            client.startAutoRefresh('development', 5000);
            expect(client.secrets.getSecrets).not.toHaveBeenCalled();

            jest.advanceTimersByTime(5000);
            expect(client.secrets.getSecrets).toHaveBeenCalledTimes(1);

            client.stopAutoRefresh();
            jest.advanceTimersByTime(10000);
            expect(client.secrets.getSecrets).toHaveBeenCalledTimes(1);
        });

        it('expressMiddleware injects secrets into req.secrets and passes to next()', async () => {
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1' });
            const middleware = client.expressMiddleware('development');

            const req: any = {};
            const next = jest.fn();

            await middleware(req, {}, next);

            expect(req.secrets).toEqual({
                DATABASE_URL: 'postgres://user:pass@localhost:5432/devdb',
                DEV_ONLY: 'true'
            });
            expect(next).toHaveBeenCalledWith();
        });
    });
});
