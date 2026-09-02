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
 * Encrypt secret value locally using AES-256-GCM
 */
export function encryptSecretValue(plaintext: string, projectKeyHex: string): EncryptedPayload {
  const key = Buffer.from(projectKeyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('Project Key must be 32 bytes (64 hex characters)');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag
  };
}

/**
 * Decrypt secret value locally using AES-256-GCM
 */
export function decryptSecretValue(payload: EncryptedPayload, projectKeyHex: string): string {
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
  // Generate ephemeral local keypair for ECDH exchange
  const { publicKey: ephemeralPublic, privateKey: ephemeralPrivate } = crypto.generateKeyPairSync('x25519');
  const ephemeralPublicKeyPem = ephemeralPublic.export({ type: 'spki', format: 'pem' }).toString();
  
  const recipientPublicKey = crypto.createPublicKey(recipientPublicKeyPem);
  const sharedSecret = crypto.diffieHellman({
    privateKey: ephemeralPrivate,
    publicKey: recipientPublicKey
  });

  // Derive AES key from shared secret via HKDF
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
  const entropy = crypto.randomBytes(32);
  const recoveryKey = entropy.toString('hex');

  const wordList = [
    'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
    'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
    'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray',
    'yankee', 'zulu', 'shield', 'vault', 'cipher', 'zero', 'trust', 'guard'
  ];

  const words: string[] = [];
  for (let i = 0; i < 24; i++) {
    const index = entropy[i % 32] % wordList.length;
    words.push(wordList[index]);
  }

  return {
    mnemonic: words.join(' '),
    recoveryKey
  };
}
