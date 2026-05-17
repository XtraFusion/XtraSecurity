import crypto from "crypto"

const ALGORITHM = 'aes-256-gcm';

// AES-256 key must be 32 bytes (64 hex characters)
const getEncryptionKey = () => {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (!envKey) {
    throw new Error("FATAL: ENCRYPTION_KEY environment variable is required. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
  }
  
  // Convert hex string to buffer
  return Buffer.from(envKey, 'hex');
};

const KEY = getEncryptionKey();

// Encrypt function
export function encrypt(text: string) {
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
export function decrypt(encrypted: { iv: string; encryptedData: string; authTag: string }) {
  const { iv, encryptedData, authTag } = encrypted;
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
