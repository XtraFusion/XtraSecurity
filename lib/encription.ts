import crypto from "crypto"
const ALGORITHM = 'aes-256-gcm';
// AES-256 key must be 32 bytes
const KEY = crypto.randomBytes(32);

// Encrypt function
export function encrypt(text) {
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
export function decrypt(encrypted) {
  const { iv, encryptedData, authTag } = encrypted;
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
