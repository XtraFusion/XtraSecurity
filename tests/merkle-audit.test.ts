import { XtraMerkleLedger } from '../sdk/node/merkle';

describe('Feature 4: Cryptographically Verifiable Merkle Audit Ledger (xtra audit verify)', () => {
    let ledger: XtraMerkleLedger;

    beforeEach(() => {
        ledger = new XtraMerkleLedger();
    });

    it('hashes audit events into a SHA-256 Merkle chain and computes valid Merkle Root', () => {
        const node1 = ledger.appendLog({
            actor: 'alice@xtra.dev',
            action: 'SECRET_CREATE',
            secretKey: 'DATABASE_URL',
            environment: 'production',
            timestamp: 1700000000000
        });

        const node2 = ledger.appendLog({
            actor: 'bob@xtra.dev',
            action: 'SECRET_ROTATE',
            secretKey: 'STRIPE_KEY',
            environment: 'production',
            timestamp: 1700000010000
        });

        expect(node1.hash).toMatch(/^[a-f0-9]{64}$/);
        expect(node2.hash).toMatch(/^[a-f0-9]{64}$/);
        expect(node2.previousHash).toBe(node1.hash);

        const merkleRoot = ledger.getMerkleRoot();
        expect(merkleRoot).toMatch(/^[a-f0-9]{64}$/);
    });

    it('verifies integrity of unaltered audit event chain', () => {
        ledger.appendLog({ actor: 'user1', action: 'LOGIN', secretKey: '-', environment: 'dev' });
        ledger.appendLog({ actor: 'user1', action: 'READ_SECRET', secretKey: 'API_KEY', environment: 'dev' });
        ledger.appendLog({ actor: 'user2', action: 'JIT_CLAIM', secretKey: 'PROD_DB', environment: 'prod' });

        const result = ledger.verifyIntegrity();
        expect(result.isValid).toBe(true);
        expect(result.totalEvents).toBe(3);
        expect(result.tamperedIndex).toBeUndefined();
    });

    it('detects simulated audit tampering (modifying a logged action) and fails verification', () => {
        ledger.appendLog({ actor: 'alice@xtra.dev', action: 'SECRET_CREATE', secretKey: 'KEY_1', environment: 'prod', timestamp: 1000 });
        ledger.appendLog({ actor: 'bob@xtra.dev', action: 'SECRET_DELETE', secretKey: 'KEY_2', environment: 'prod', timestamp: 2000 });
        ledger.appendLog({ actor: 'carol@xtra.dev', action: 'SECRET_ROTATE', secretKey: 'KEY_3', environment: 'prod', timestamp: 3000 });

        // Simulate rogue admin modifying audit event #1 (index 1) directly in storage
        const chain = ledger.getChain();
        chain[1].action = 'SECRET_READ'; // Altered action!

        const result = ledger.verifyIntegrity();
        expect(result.isValid).toBe(false);
        expect(result.tamperedIndex).toBe(1);
        expect(result.reason).toContain('Tampered log payload at index 1');
    });

    it('detects chain breakage if a historical log node is deleted', () => {
        ledger.appendLog({ actor: 'a', action: 'ACT1', secretKey: 'K1', environment: 'dev', timestamp: 100 });
        ledger.appendLog({ actor: 'b', action: 'ACT2', secretKey: 'K2', environment: 'dev', timestamp: 200 });
        ledger.appendLog({ actor: 'c', action: 'ACT3', secretKey: 'K3', environment: 'dev', timestamp: 300 });

        const chain = ledger.getChain();
        // Remove index 1
        chain.splice(1, 1);

        const result = ledger.verifyIntegrity();
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('Broken chain link');
    });
});
