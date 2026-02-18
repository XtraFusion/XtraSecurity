import { createHash } from "crypto";
import prisma from "@/lib/db"; // Assuming default export based on cli-logs route

const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

interface AuditLogData {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes: any;
  timestamp?: Date;
}

/**
 * Creates a tamper-evident audit log entry.
 * Uses SHA-256 hash chaining (blockchain-style).
 */
export async function createTamperEvidentLog(data: AuditLogData) {
  // 1. Fetch the latest log (head of the chain)
  // We strictly verify serialization by timestamp + insertion order if needed, 
  // but for MVP findFirst order by timestamp desc is sufficient.
  const lastLog = await prisma.auditLog.findFirst({
    orderBy: { timestamp: "desc" },
  });

  const previousHash = lastLog?.currentHash || GENESIS_HASH;
  const timestamp = data.timestamp || new Date();

  // 2. Compute New Hash
  // H = SHA256( prevHash + timestamp + action + userId + entityId + JSON(changes) )
  const payload = [
      previousHash,
      timestamp.toISOString(),
      data.action,
      data.userId,
      data.entityId,
      JSON.stringify(data.changes)
  ].join("|");

  const currentHash = createHash("sha256").update(payload).digest("hex");

  // 3. Insert
  return await prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      changes: data.changes,
      timestamp: timestamp,
      previousHash: previousHash,
      currentHash: currentHash
    }
  });
}

/**
 * Verifies the integrity of the audit log chain.
 * Returns { valid: boolean, brokenAtId?: string }
 */
export async function verifyAuditChain() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "asc" } 
  });

  if (logs.length === 0) return { valid: true };

  let expectedPrevHash = GENESIS_HASH;

  for (const log of logs) {
    // 1. Check previous hash link
    if (log.previousHash !== expectedPrevHash) {
        return { valid: false, brokenAtId: log.id, reason: "Previous hash mismatch" };
    }

    // 2. Re-compute current hash
    const payload = [
        log.previousHash,
        log.timestamp.toISOString(),
        log.action,
        log.userId,
        log.entityId,
        JSON.stringify(log.changes)
    ].join("|");

    const computedHash = createHash("sha256").update(payload).digest("hex");

    if (computedHash !== log.currentHash) {
         return { valid: false, brokenAtId: log.id, reason: "Hash verification failed" };
    }

    // Advance
    expectedPrevHash = log.currentHash!;
  }

  return { valid: true };
}
