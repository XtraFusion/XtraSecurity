import { XtraDynamicSecrets } from '../sdk/node/dynamic';
import { XtraClient } from '../sdk/node/wrapper';

describe('Feature 3: Dynamic Ephemeral Database Credentials (xtra secrets dynamic)', () => {
    let dynamicEngine: XtraDynamicSecrets;

    beforeEach(() => {
        dynamicEngine = new XtraDynamicSecrets();
    });

    describe('PostgreSQL Dynamic Credentials', () => {
        it('generates temporary postgres user with connection string, DDL, and TTL expiry', () => {
            const credential = dynamicEngine.createDynamicSecret({
                engine: 'postgres',
                ttlMinutes: 15,
                dbHost: 'db.prod.internal:5432',
                dbName: 'orders_db'
            });

            expect(credential.id).toMatch(/^dyn_sec_/);
            expect(credential.username).toMatch(/^xtra_tmp_/);
            expect(credential.connectionString).toContain('postgres://xtra_tmp_');
            expect(credential.connectionString).toContain('@db.prod.internal:5432/orders_db');
            expect(credential.createDdl).toContain(`CREATE USER ${credential.username}`);
            expect(credential.createDdl).toContain('VALID UNTIL');
            expect(credential.revokeDdl).toContain(`DROP USER IF EXISTS ${credential.username}`);
            expect(credential.isRevoked).toBe(false);
            expect(credential.ttlMinutes).toBe(15);
        });
    });

    describe('MySQL & MongoDB Dynamic Credentials', () => {
        it('generates temporary MySQL credentials with host wildcards and DDL grants', () => {
            const credential = dynamicEngine.createDynamicSecret({
                engine: 'mysql',
                ttlMinutes: 60,
                dbHost: 'mysql.internal:3306',
                dbName: 'user_db'
            });

            expect(credential.connectionString).toContain('mysql://xtra_tmp_');
            expect(credential.createDdl).toContain(`CREATE USER '${credential.username}'@'%'`);
            expect(credential.revokeDdl).toContain(`DROP USER IF EXISTS '${credential.username}'@'%'`);
        });

        it('generates MongoDB db.createUser and db.dropUser script blocks', () => {
            const credential = dynamicEngine.createDynamicSecret({
                engine: 'mongodb',
                ttlMinutes: 30,
                dbHost: 'mongo.internal:27017',
                dbName: 'analytics'
            });

            expect(credential.connectionString).toContain('mongodb://xtra_tmp_');
            expect(credential.createDdl).toContain(`db.createUser({ user: "${credential.username}"`);
            expect(credential.revokeDdl).toContain(`db.dropUser("${credential.username}")`);
        });
    });

    describe('Lifecycle & Revocation', () => {
        it('lists active dynamic secrets and revokes credentials on demand', () => {
            const cred1 = dynamicEngine.createDynamicSecret({ engine: 'postgres', ttlMinutes: 10 });
            const cred2 = dynamicEngine.createDynamicSecret({ engine: 'mysql', ttlMinutes: 20 });

            expect(dynamicEngine.listActiveSecrets().length).toBe(2);

            const revoked = dynamicEngine.revokeDynamicSecret(cred1.id);
            expect(revoked?.isRevoked).toBe(true);
            expect(dynamicEngine.listActiveSecrets().length).toBe(1);
            expect(dynamicEngine.listActiveSecrets()[0].id).toBe(cred2.id);
        });
    });

    describe('XtraClient SDK Integration', () => {
        it('exposes createDynamicSecret() via XtraClient instance', () => {
            const client = new XtraClient({ token: 'test-token', projectId: 'proj_dynamic' });
            const credential = client.createDynamicSecret({
                engine: 'postgres',
                ttlMinutes: 45
            });

            expect(credential.username).toMatch(/^xtra_tmp_/);
            expect(credential.ttlMinutes).toBe(45);
        });
    });
});
