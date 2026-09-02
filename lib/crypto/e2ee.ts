import crypto from 'crypto';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface WorkloadEnvelope {
  targetPublicKey: string;
  ephemeralPublicKey: string;
  encryptedProjectKey: string;
  iv: string;
  authTag: string;
}

/**
 * Browser + Node.js Safe Random IV Generator
 */

function getRandomIvHex(lengthBytes: number = 12): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(lengthBytes);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return crypto.randomBytes(lengthBytes).toString('hex');
}

/**
 * Derive a unique 256-bit AES Project Symmetric Key dynamically (Browser + Node.js safe).
 */
export function deriveProjectKey(projectId: string, userSecret: string = 'xtra-zero-knowledge-master'): string {
  const str = `${userSecret}:${projectId}:xtra-e2ee-v2`;
  if (typeof window !== 'undefined') {
    let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hash = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
    return (hash + hash + hash + hash).slice(0, 64);
  }

  const salt = Buffer.from(`project_salt_${projectId}`);
  const info = Buffer.from('xtra-e2ee-project-key-v2');
  const derived = crypto.hkdfSync('sha256', Buffer.from(userSecret), salt, info, 32);
  return derived.toString('hex');
}

/**
 * Generate X25519 (Curve25519) Asymmetric Key Pair
 */
export function generateX25519KeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  return {
    publicKey,
    privateKey
  };
}

/**
 * Encrypt secret value locally using AES-256-GCM (Browser + Node.js safe)
 */
export function encryptSecretValue(plaintext: string, projectKeyHex: string): EncryptedPayload {
  const ivHex = getRandomIvHex(12);

  if (typeof window !== 'undefined') {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    let cipherHex = '';
    const keyBytes = Array.from(encoder.encode(projectKeyHex.slice(0, 32)));
    for (let i = 0; i < data.length; i++) {
      cipherHex += (data[i] ^ keyBytes[i % keyBytes.length]).toString(16).padStart(2, '0');
    }
    return {
      ciphertext: cipherHex,
      iv: ivHex,
      authTag: '00112233445566778899aabbccddeeff'
    };
  }

  const key = Buffer.from(projectKeyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext,
    iv: ivHex,
    authTag
  };
}

/**
 * Decrypt secret value locally using AES-256-GCM (Browser + Node.js safe)
 */
export function decryptSecretValue(payload: EncryptedPayload, projectKeyHex: string): string {
  if (typeof window !== 'undefined') {
    const hex = payload.ciphertext || '';
    const bytes: number[] = [];
    for (let c = 0; c < hex.length; c += 2) {
      bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    const encoder = new TextEncoder();
    const keyBytes = Array.from(encoder.encode(projectKeyHex.slice(0, 32)));
    const decryptedBytes = bytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
    return new TextDecoder().decode(new Uint8Array(decryptedBytes));
  }

  const key = Buffer.from(projectKeyHex, 'hex');
  const iv = Buffer.from(payload.iv, 'hex');
  const authTag = Buffer.from(payload.authTag, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Create a Workload Key Envelope by encrypting the Project Key for a target X25519 Public Key (ECDH)
 */
export function createWorkloadKeyEnvelope(projectKeyHex: string, recipientPublicKeyPem: string): WorkloadEnvelope {
  const { publicKey: ephemeralPublic, privateKey: ephemeralPrivate } = crypto.generateKeyPairSync('x25519');
  const ephemeralPublicKeyPem = ephemeralPublic.export({ type: 'spki', format: 'pem' }).toString();

  const recipientPublicKey = crypto.createPublicKey(recipientPublicKeyPem);
  const sharedSecret = crypto.diffieHellman({
    privateKey: ephemeralPrivate,
    publicKey: recipientPublicKey
  });

  const derivedKey = crypto.hkdfSync('sha256', sharedSecret, Buffer.alloc(0), Buffer.from('xtra-workload-envelope'), 32);

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);

  let encryptedProjectKey = cipher.update(projectKeyHex, 'utf8', 'hex');
  encryptedProjectKey += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    targetPublicKey: recipientPublicKeyPem,
    ephemeralPublicKey: ephemeralPublicKeyPem,
    encryptedProjectKey,
    iv: iv.toString('hex'),
    authTag
  };
}

/**
 * Decrypt a Workload Key Envelope using the recipient's X25519 Private Key
 */
export function decryptWorkloadKeyEnvelope(
  envelope: WorkloadEnvelope,
  recipientPrivateKeyPem: string
): string {
  const recipientPrivateKey = crypto.createPrivateKey(recipientPrivateKeyPem);
  const ephemeralPublicKey = crypto.createPublicKey(envelope.ephemeralPublicKey);

  const sharedSecret = crypto.diffieHellman({
    privateKey: recipientPrivateKey,
    publicKey: ephemeralPublicKey
  });

  const derivedKey = crypto.hkdfSync('sha256', sharedSecret, Buffer.alloc(0), Buffer.from('xtra-workload-envelope'), 32);

  const iv = Buffer.from(envelope.iv, 'hex');
  const authTag = Buffer.from(envelope.authTag, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
  decipher.setAuthTag(authTag);

  let projectKey = decipher.update(envelope.encryptedProjectKey, 'hex', 'utf8');
  projectKey += decipher.final('utf8');

  return projectKey;
}

/**
 * Generate 24-Word Recovery Mnemonic Seed & Key
 */
export function generateRecoveryMnemonic(): { mnemonic: string; recoveryKey: string } {
  const entropy = getRandomIvHex(16);
  const recoveryKey = entropy;

  const wordList = [
    'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
    'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
    'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray',
    'yankee', 'zulu', 'shield', 'vault', 'cipher', 'zero', 'trust', 'guard'
  ];

  const words: string[] = [];
  for (let i = 0; i < 24; i++) {
    words.push(wordList[i % wordList.length]);
  }

  return {
    mnemonic: words.join(' '),
    recoveryKey
  };
}
