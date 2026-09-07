import crypto from "crypto"

const ALGORITHM = 'aes-256-gcm';

// AES-256 key must be 32 bytes (64 hex characters)
let cachedKey: Buffer | null = null;
const getEncryptionKey = () => {
  if (cachedKey && process.env.ENCRYPTION_KEY) {
    return cachedKey;
  }
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: ENCRYPTION_KEY environment variable is required in production mode.');
    }
    // Development/Test fallback key only
    const devFallbackKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    cachedKey = Buffer.from(devFallbackKey, 'hex');
    return cachedKey;
  }
  cachedKey = Buffer.from(envKey, 'hex');
  return cachedKey;
};

// Encrypt function
export function encrypt(text: string) {
  const KEY = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Recommended 12 bytes for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag,
  };
}

// Decrypt function
export function decrypt(encrypted: {
  iv: string;
  encryptedData?: string;
  ciphertext?: string;
  authTag?: string;
  tag?: string;
  projectId?: string;
}) {
  const { iv } = encrypted;
  const encryptedData = encrypted.encryptedData || encrypted.ciphertext;
  const authTag = encrypted.authTag || encrypted.tag;

  if (!encryptedData || !iv || !authTag) {
    throw new Error("Invalid encrypted payload: missing iv, encryptedData/ciphertext, or authTag");
  }

  // 1. Try standard server decryption with ENCRYPTION_KEY
  try {
    const KEY = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (serverDecryptionErr) {
    // 2. If it's a v2 E2EE payload with ciphertext and projectId, attempt projectKey derivation
    if (encrypted.ciphertext && encrypted.projectId) {
      try {
        const { decryptSecretValue, deriveProjectKey } = require("./crypto/e2ee");
        const projectKey = deriveProjectKey(encrypted.projectId);
        return decryptSecretValue({ ciphertext: encryptedData, iv, authTag }, projectKey);
      } catch (_) {}
    }
    throw serverDecryptionErr;
  }
}
