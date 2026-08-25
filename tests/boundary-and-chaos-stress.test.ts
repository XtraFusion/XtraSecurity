import { XtraDynamicSecrets } from '../sdk/node/dynamic';
import { XtraSentinel } from '../sdk/node/sentinel';
import { XtraMerkleLedger } from '../sdk/node/merkle';
import { XtraClient } from '../sdk/node/wrapper';
import { SCAN_PATTERNS } from '../xtra-cli/src/commands/scan';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

jest.mock('axios');

describe('Boundary Edge-Case & Chaos Stress Testing Suite', () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('1. Dynamic Ephemeral Secrets DDL Sanitization & Injection Boundaries', () => {
        const dynamicEngine = new XtraDynamicSecrets();

        it('sanitizes and safely formats DDL when dbHost and dbName contain complex characters', () => {
            const credential = dynamicEngine.createDynamicSecret({
                engine: 'postgres',
                ttlMinutes: 10,
                dbHost: 'db-replica.us-east-1.internal:5432',
                dbName: 'production_main_v2'
            });

            expect(credential.username).toMatch(/^xtra_tmp_[a-f0-9]{8}$/);
            expect(credential.password).not.toContain("'"); // Escaped
            expect(credential.createDdl).toContain(`CREATE USER ${credential.username}`);
            expect(credential.createDdl).toContain('VALID UNTIL');
            expect(credential.revokeDdl).toContain(`DROP USER IF EXISTS ${credential.username}`);
        });

        it('handles immediate TTL expiration and zero-duration edge cases gracefully', () => {
            const credential = dynamicEngine.createDynamicSecret({
                engine: 'mysql',
                ttlMinutes: 0.001 // Extremely short TTL (~60ms)
            });

            expect(credential.isRevoked).toBe(false);
            const revoked = dynamicEngine.revokeDynamicSecret(credential.id);
            expect(revoked?.isRevoked).toBe(true);
            // Re-revoking already revoked secret returns undefined
            expect(dynamicEngine.revokeDynamicSecret(credential.id)).toBeUndefined();
        });
    });

    describe('2. Groq AI Sentinel Malformed Payload & Error Boundaries', () => {
        it('handles Groq API HTTP 500 error gracefully by falling back to heuristic engine without crashing', async () => {
            mockedAxios.post.mockRejectedValueOnce(new Error('Groq API Internal Server Error 500'));

            const sentinel = new XtraSentinel('mock-groq-key');
            const assessment = await sentinel.evaluateThreat({
                projectId: 'proj_chaos',
                environment: 'production',
                requestCount: 1,
                timeWindowMs: 10000,
                secretKeys: ['DB_PASS']
            });

            expect(assessment.evaluatedBy).toBe('heuristic-fallback');
            expect(assessment.isAnomalous).toBe(false);
        });

        it('handles malformed non-JSON Groq AI response string gracefully', async () => {
            mockedAxios.post.mockResolvedValueOnce({
                data: {
                    choices: [
                        {
                            message: { content: 'MALFORMED_NON_JSON_AI_RESPONSE_STRING' }
                        }
                    ]
                }
            });

            const sentinel = new XtraSentinel('mock-groq-key');
            const assessment = await sentinel.evaluateThreat({
                projectId: 'proj_chaos',
                environment: 'production',
                requestCount: 1,
                timeWindowMs: 10000,
                secretKeys: ['DB_PASS']
            });

            expect(assessment.evaluatedBy).toBe('heuristic-fallback');
        });

        it('processes extreme payload with 1,000 secret keys in a single batch without memory or stack overflow', async () => {
            const largeSecretBatch = Array.from({ length: 1000 }, (_, i) => `SECRET_KEY_${i}`);
            const sentinel = new XtraSentinel(undefined);

            const assessment = await sentinel.evaluateThreat({
                projectId: 'proj_extreme_bulk',
                environment: 'production',
                requestCount: 1,
                timeWindowMs: 10000,
                secretKeys: largeSecretBatch
            });

            expect(assessment.isAnomalous).toBe(true);
            expect(assessment.recommendedAction).toBe('REVOKE_AND_ROTATE');
        });
    });

    describe('3. Hardware Encrypted Disk Cache Tampering & Theft Resistance', () => {
        it('rejects tampered disk cache file with corrupted authTag or modified bytes cleanly without process crash', () => {
            const client = new XtraClient({ token: 'test-token', projectId: 'proj_tamper_test' });

            const cacheDir = path.join(os.homedir(), '.xtra', 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            const cacheFile = path.join(cacheDir, 'cache_proj_tamper_test_development.enc');

            // Write corrupted payload string
            const corruptedPayload = JSON.stringify({
                iv: '1234567890abcdef12345678',
                encrypted: 'deadbeef12345678',
                authTag: 'badtag00000000000000000000000000'
            });
            fs.writeFileSync(cacheFile, corruptedPayload, 'utf-8');

            // Attempting to read disk cache returns null due to GCM MAC authentication failure
            const decrypted = (client as any).readDiskCache('proj_tamper_test', 'development');
            expect(decrypted).toBeNull();

            // Cleanup
            if (fs.existsSync(cacheFile)) {
                try { fs.unlinkSync(cacheFile); } catch (_) {}
            }
        });
    });

    describe('4. Merkle Audit Ledger Deep Chain & Micro-Tamper Boundaries', () => {
        it('computes valid Merkle Root across a deep chain of 500 events', () => {
            const ledger = new XtraMerkleLedger();

            for (let i = 0; i < 500; i++) {
                ledger.appendLog({
                    actor: `user_${i % 10}@company.com`,
                    action: i % 2 === 0 ? 'READ' : 'UPDATE',
                    secretKey: `KEY_${i}`,
                    environment: 'production',
                    timestamp: 1700000000000 + i * 1000
                });
            }

            const rootHash = ledger.getMerkleRoot();
            expect(rootHash).toMatch(/^[a-f0-9]{64}$/);

            const verification = ledger.verifyIntegrity();
            expect(verification.isValid).toBe(true);
            expect(verification.totalEvents).toBe(500);
        });

        it('detects a 1ms timestamp micro-tamper deep inside a 100-event chain at index 42', () => {
            const ledger = new XtraMerkleLedger();

            for (let i = 0; i < 100; i++) {
                ledger.appendLog({
                    actor: `actor_${i}`,
                    action: 'ACCESS',
                    secretKey: `SECRET_${i}`,
                    environment: 'production',
                    timestamp: 1700000000000 + i * 500
                });
            }

            // Alter timestamp of event 42 by 1 millisecond
            const chain = ledger.getChain();
            chain[42].timestamp += 1;

            const verification = ledger.verifyIntegrity();
            expect(verification.isValid).toBe(false);
            expect(verification.tamperedIndex).toBe(42);
        });
    });

    describe('5. Git Pre-Commit Scanner Edge Cases', () => {
        it('handles multi-secret lines and OpenAI/Stripe key formats correctly', () => {
            const mockStripeKey = ['sk', 'live', 'mockkey1234567890abcdef1234567890'].join('_');
            const sampleLine = `const key1 = "${mockStripeKey}"; const key2 = "AKIAIOSFODNN7EXAMPLE";`;
            
            const stripePattern = SCAN_PATTERNS.find(p => p.name.includes('Stripe'));
            const awsPattern = SCAN_PATTERNS.find(p => p.name.includes('AWS'));

            expect(stripePattern?.regex.test(sampleLine)).toBe(true);
            expect(awsPattern?.regex.test(sampleLine)).toBe(true);
        });
    });
});
