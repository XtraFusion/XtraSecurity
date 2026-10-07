import { encryptSecretValue, decryptSecretValue, deriveProjectKey } from "./crypto/e2ee";
import crypto from "crypto";

const ALGORITHM = 'aes-256-gcm';

// Legacy fallback key logic for records encrypted before E2EE migration
let cachedLegacyKey: Buffer | null = null;
const getLegacyKey = () => {
  if (cachedLegacyKey && process.env.ENCRYPTION_KEY) {
    return cachedLegacyKey;
  }
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: ENCRYPTION_KEY environment variable is required in production mode for legacy fallback.');
    }
    const devFallbackKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    cachedLegacyKey = Buffer.from(devFallbackKey, 'hex');
    return cachedLegacyKey;
  }
  cachedLegacyKey = Buffer.from(envKey, 'hex');
  return cachedLegacyKey;
};

// Encrypt function (Fully migrated to E2EE derivation)
export function encrypt(text: string, projectId: string = "system-fallback") {
  const projectKey = deriveProjectKey(projectId);
  const payload = encryptSecretValue(text, projectKey);
  
  return {
    iv: payload.iv,
    encryptedData: payload.ciphertext,
    authTag: payload.authTag,
    projectId: projectId, // Inject for intelligent decryption
  };
}

// Decrypt function (Supports new E2EE and falls back to Legacy)
export function decrypt(encrypted: {
  iv: string;
  encryptedData?: string;
  ciphertext?: string;
  authTag?: string;
  tag?: string;
  projectId?: string;
}, fallbackProjectId: string = "system-fallback") {
  const { iv } = encrypted;
  const encryptedData = encrypted.encryptedData || encrypted.ciphertext;
  const authTag = encrypted.authTag || encrypted.tag;
  const projectId = encrypted.projectId || fallbackProjectId;

  if (!encryptedData || !iv || !authTag) {
    throw new Error("Invalid encrypted payload: missing iv, encryptedData/ciphertext, or authTag");
  }

  // 1. Try E2EE Decryption (The new standard)
  try {
    const projectKey = deriveProjectKey(projectId);
    return decryptSecretValue({
        ciphertext: encryptedData,
        iv: iv,
        authTag: authTag
    }, projectKey);
  } catch (e2eeError) {
    // 2. Fallback to Legacy server decryption if E2EE fails (for old DB records)
    try {
      const KEY = getLegacyKey();
      const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (legacyError) {
      throw new Error("Decryption failed for both E2EE and Legacy fallback.");
    }
  }
}
