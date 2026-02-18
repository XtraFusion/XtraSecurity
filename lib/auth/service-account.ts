import { randomBytes, createHash } from 'crypto';

const KEY_PREFIX = 'xtra_';
const KEY_LENGTH = 32;

/**
 * Generates a new API Key and its hash.
 * Format: xtra_[32_bytes_hex]
 */
export function generateApiKey() {
  const bytes = randomBytes(KEY_LENGTH);
  const key = `${KEY_PREFIX}${bytes.toString('hex')}`;
  const hash = hashApiKey(key);
  const mask = `${KEY_PREFIX}...${key.slice(-4)}`;
  
  return { key, hash, mask };
}

/**
 * Hashes an API Key for storage.
 * using SHA-256
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validates a key against a stored hash.
 */
export function validateApiKey(key: string, storedHash: string): boolean {
  const hash = hashApiKey(key);
  return hash === storedHash;
}
