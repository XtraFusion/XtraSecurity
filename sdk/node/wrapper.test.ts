import { XtraClient, XtraError } from './wrapper';
import { SecretsApi } from './api';

jest.mock('./api', () => {
    return {
        SecretsApi: jest.fn().mockImplementation(() => ({
            getSecrets: jest.fn().mockResolvedValue({
                data: {
                    DATABASE_URL: 'postgres://user:pass@localhost:5432/testdb',
                    API_KEY: 'sk_test_12345'
                }
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

describe('XtraClient Node.js SDK', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        delete process.env.XTRA_TOKEN;
        delete process.env.XTRA_PROJECT_ID;
        delete process.env.DATABASE_URL;
        delete process.env.API_KEY;
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
            expect(client.projects).toBeDefined();
            expect(client.teams).toBeDefined();
            expect(client.access).toBeDefined();
            expect(client.audit).toBeDefined();
            expect(client.branches).toBeDefined();
            expect(client.notifications).toBeDefined();
        });

        it('initializes successfully using environment variables XTRA_TOKEN and XTRA_PROJECT_ID', () => {
            process.env.XTRA_TOKEN = 'env-token-456';
            process.env.XTRA_PROJECT_ID = 'env-proj-789';

            const client = new XtraClient();
            expect(client).toBeDefined();
        });
    });

    describe('getSecrets & Caching', () => {
        it('throws XtraError if project ID is missing', async () => {
            const client = new XtraClient({ token: 'valid-token' });
            await expect(client.getSecrets('development')).rejects.toThrow('Project ID is required.');
        });

        it('fetches secrets from API and caches the result', async () => {
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1', cacheTtl: 5000 });
            
            const secrets1 = await client.getSecrets('development');
            expect(secrets1).toEqual({
                DATABASE_URL: 'postgres://user:pass@localhost:5432/testdb',
                API_KEY: 'sk_test_12345'
            });

            // Second call should return cached data without calling SecretsApi again
            const secrets2 = await client.getSecrets('development');
            expect(secrets2).toEqual(secrets1);
            expect(client.secrets.getSecrets).toHaveBeenCalledTimes(1);
        });

        it('bypasses cache when noCache = true', async () => {
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1' });

            await client.getSecrets('development');
            await client.getSecrets('development', undefined, undefined, true);

            expect(client.secrets.getSecrets).toHaveBeenCalledTimes(2);
        });

        it('clears in-memory cache when clearCache is invoked', async () => {
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1' });

            await client.getSecrets('development');
            client.clearCache();
            await client.getSecrets('development');

            expect(client.secrets.getSecrets).toHaveBeenCalledTimes(2);
        });
    });

    describe('injectSecrets', () => {
        it('injects secrets into process.env without overriding existing ones by default', async () => {
            process.env.DATABASE_URL = 'existing_db';
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1' });

            await client.injectSecrets('development');

            expect(process.env.DATABASE_URL).toBe('existing_db');
            expect(process.env.API_KEY).toBe('sk_test_12345');
        });

        it('overrides existing environment variables when override = true', async () => {
            process.env.DATABASE_URL = 'existing_db';
            const client = new XtraClient({ token: 'valid-token', projectId: 'proj-1' });

            await client.injectSecrets('development', { override: true });

            expect(process.env.DATABASE_URL).toBe('postgres://user:pass@localhost:5432/testdb');
            expect(process.env.API_KEY).toBe('sk_test_12345');
        });
    });
});
