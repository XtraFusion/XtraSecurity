import * as crypto from 'crypto';

export type DatabaseEngine = 'postgres' | 'mysql' | 'mongodb';

export interface DynamicSecretOptions {
    engine: DatabaseEngine;
    ttlMinutes?: number;
    dbHost?: string;
    dbName?: string;
    role?: string;
}

export interface DynamicSecretCredential {
    id: string;
    engine: DatabaseEngine;
    username: string;
    password: string;
    connectionString: string;
    createdAt: number;
    expiresAt: number;
    ttlMinutes: number;
    createDdl: string;
    revokeDdl: string;
    isRevoked: boolean;
}

export class XtraDynamicSecrets {
    private activeSecrets: Map<string, { credential: DynamicSecretCredential; timer?: NodeJS.Timeout }> = new Map();

    /**
     * Generates a temporary, self-destructing dynamic database credential with DDL statements and background revocation timers.
     */
    public createDynamicSecret(options: DynamicSecretOptions): DynamicSecretCredential {
        const ttlMinutes = options.ttlMinutes || 30; // Default 30 min TTL
        const randId = crypto.randomBytes(4).toString('hex');
        const username = `xtra_tmp_${randId}`;
        const password = `Xtra_Secret_${crypto.randomBytes(12).toString('hex')}!`;
        const createdAt = Date.now();
        const expiresAt = createdAt + ttlMinutes * 60 * 1000;
        const secretId = `dyn_sec_${randId}`;

        const host = options.dbHost || 'localhost:5432';
        const db = options.dbName || 'main_db';

        let connectionString = '';
        let createDdl = '';
        let revokeDdl = '';

        if (options.engine === 'postgres') {
            connectionString = `postgres://${username}:${encodeURIComponent(password)}@${host}/${db}`;
            createDdl = `CREATE USER ${username} WITH PASSWORD '${password}' VALID UNTIL '${new Date(expiresAt).toISOString()}'; GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO ${username};`;
            revokeDdl = `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ${username}; DROP USER IF EXISTS ${username};`;
        } else if (options.engine === 'mysql') {
            connectionString = `mysql://${username}:${encodeURIComponent(password)}@${host}/${db}`;
            createDdl = `CREATE USER '${username}'@'%' IDENTIFIED BY '${password}'; GRANT SELECT, INSERT, UPDATE ON ${db}.* TO '${username}'@'%';`;
            revokeDdl = `REVOKE ALL PRIVILEGES ON ${db}.* FROM '${username}'@'%'; DROP USER IF EXISTS '${username}'@'%';`;
        } else if (options.engine === 'mongodb') {
            connectionString = `mongodb://${username}:${encodeURIComponent(password)}@${host}/${db}`;
            createDdl = `db.createUser({ user: "${username}", pwd: "${password}", roles: [{ role: "readWrite", db: "${db}" }] });`;
            revokeDdl = `db.dropUser("${username}");`;
        }

        const credential: DynamicSecretCredential = {
            id: secretId,
            engine: options.engine,
            username,
            password,
            connectionString,
            createdAt,
            expiresAt,
            ttlMinutes,
            createDdl,
            revokeDdl,
            isRevoked: false
        };

        // Schedule background self-destruct timer
        const timer = setTimeout(() => {
            this.revokeDynamicSecret(secretId);
        }, ttlMinutes * 60 * 1000);

        if (typeof timer.unref === 'function') {
            timer.unref(); // Prevent timer from keeping Node process alive
        }

        this.activeSecrets.set(secretId, { credential, timer });
        return credential;
    }

    /**
     * Immediately revokes a dynamic secret and triggers DDL cleanup.
     */
    public revokeDynamicSecret(secretId: string): DynamicSecretCredential | undefined {
        const item = this.activeSecrets.get(secretId);
        if (!item) return undefined;

        if (item.timer) {
            clearTimeout(item.timer);
        }

        item.credential.isRevoked = true;
        this.activeSecrets.delete(secretId);
        return item.credential;
    }

    /**
     * Lists all active unexpired dynamic secrets.
     */
    public listActiveSecrets(): DynamicSecretCredential[] {
        return Array.from(this.activeSecrets.values())
            .map(i => i.credential)
            .filter(c => !c.isRevoked && c.expiresAt > Date.now());
    }
}
