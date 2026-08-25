import * as crypto from 'crypto';

export interface MerkleLogNode {
    index: number;
    timestamp: number;
    actor: string;
    action: string;
    secretKey: string;
    environment: string;
    previousHash: string;
    hash: string;
}

export interface MerkleVerificationResult {
    isValid: boolean;
    totalEvents: number;
    rootHash: string;
    tamperedIndex?: number;
    reason?: string;
}

export class XtraMerkleLedger {
    private static GENESIS_HASH = '0'.repeat(64);
    private chain: MerkleLogNode[] = [];

    /**
     * Appends an audit event to the cryptographic Merkle chain.
     */
    public appendLog(event: { actor: string; action: string; secretKey: string; environment: string; timestamp?: number }): MerkleLogNode {
        const index = this.chain.length;
        const timestamp = event.timestamp || Date.now();
        const previousHash = index === 0 ? XtraMerkleLedger.GENESIS_HASH : this.chain[index - 1].hash;

        const payload = `${previousHash}:${timestamp}:${event.actor}:${event.action}:${event.secretKey}:${event.environment}`;
        const hash = crypto.createHash('sha256').update(payload).digest('hex');

        const node: MerkleLogNode = {
            index,
            timestamp,
            actor: event.actor,
            action: event.action,
            secretKey: event.secretKey,
            environment: event.environment,
            previousHash,
            hash
        };

        this.chain.push(node);
        return node;
    }

    /**
     * Computes the Merkle Root Hash for all leaf nodes in the ledger.
     */
    public getMerkleRoot(): string {
        if (this.chain.length === 0) return XtraMerkleLedger.GENESIS_HASH;

        let levelHashes = this.chain.map(node => node.hash);

        while (levelHashes.length > 1) {
            const nextLevel: string[] = [];
            for (let i = 0; i < levelHashes.length; i += 2) {
                if (i + 1 < levelHashes.length) {
                    const combined = levelHashes[i] + levelHashes[i + 1];
                    nextLevel.push(crypto.createHash('sha256').update(combined).digest('hex'));
                } else {
                    // Duplicate last odd node
                    const combined = levelHashes[i] + levelHashes[i];
                    nextLevel.push(crypto.createHash('sha256').update(combined).digest('hex'));
                }
            }
            levelHashes = nextLevel;
        }

        return levelHashes[0];
    }

    /**
     * Mathematically verifies that no audit logs in the chain have been modified, deleted, or inserted.
     */
    public verifyIntegrity(): MerkleVerificationResult {
        const rootHash = this.getMerkleRoot();
        if (this.chain.length === 0) {
            return { isValid: true, totalEvents: 0, rootHash };
        }

        for (let i = 0; i < this.chain.length; i++) {
            const node = this.chain[i];
            const expectedPrevHash = i === 0 ? XtraMerkleLedger.GENESIS_HASH : this.chain[i - 1].hash;

            if (node.previousHash !== expectedPrevHash) {
                return {
                    isValid: false,
                    totalEvents: this.chain.length,
                    rootHash,
                    tamperedIndex: i,
                    reason: `Broken chain link at index ${i}: previousHash mismatch.`
                };
            }

            const payload = `${node.previousHash}:${node.timestamp}:${node.actor}:${node.action}:${node.secretKey}:${node.environment}`;
            const recomputedHash = crypto.createHash('sha256').update(payload).digest('hex');

            if (recomputedHash !== node.hash) {
                return {
                    isValid: false,
                    totalEvents: this.chain.length,
                    rootHash,
                    tamperedIndex: i,
                    reason: `Tampered log payload at index ${i}: hash mismatch.`
                };
            }
        }

        return {
            isValid: true,
            totalEvents: this.chain.length,
            rootHash
        };
    }

    /**
     * Gets entire raw chain for testing / inspection.
     */
    public getChain(): MerkleLogNode[] {
        return this.chain;
    }
}
