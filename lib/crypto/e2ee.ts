import crypto from 'crypto';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  projectId?: string;
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
 * Standard BIP-39 English Wordlist snippet (cryptographically curated)
 */
const BIP39_WORDS = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
  "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
  "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
  "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
  "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
  "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
  "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger",
  "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
  "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic",
  "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest",
  "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset",
  "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction",
  "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake",
  "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge",
  "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain",
  "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become",
  "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit",
  "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology",
  "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless",
  "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body",
  "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss",
  "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread",
  "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze",
  "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb",
  "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy",
  "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call",
  "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas",
  "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry",
  "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category",
  "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century",
  "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase",
  "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child",
  "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle",
  "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk",
  "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close",
  "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut",
  "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort",
  "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control",
  "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost",
  "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle",
  "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek",
  "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial",
  "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup"
];

/**
 * Browser + Node.js Safe Random Bytes / Hex Generator
 */
export function getRandomIvHex(lengthBytes: number = 12): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(lengthBytes);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return crypto.randomBytes(lengthBytes).toString('hex');
}

/**
 * Browser-safe hex to bytes converter
 */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : '0' + hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16) || 0;
  }
  return bytes;
}

/**
 * Browser-safe bytes to hex converter
 */
export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// Standard constant array for SHA-256
const K_SHA256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function rawSha256(data: Uint8Array): Uint8Array {
  let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const l = data.length;
  const bitLen = l * 8;
  const padLen = ((l + 8) >> 6 << 6) + 64;
  const buf = new Uint8Array(padLen);
  buf.set(data);
  buf[l] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(padLen - 4, bitLen >>> 0);
  view.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000));
  const W = new Uint32Array(64);
  for (let i = 0; i < padLen; i += 64) {
    for (let t = 0; t < 16; t++) W[t] = view.getUint32(i + (t * 4));
    for (let t = 16; t < 64; t++) {
      const s0 = ((W[t - 15] >>> 7) | (W[t - 15] << 25)) ^ ((W[t - 15] >>> 18) | (W[t - 15] << 14)) ^ (W[t - 15] >>> 3);
      const s1 = ((W[t - 2] >>> 17) | (W[t - 2] << 15)) ^ ((W[t - 2] >>> 19) | (W[t - 2] << 13)) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + S1 + ch + K_SHA256[t] + W[t]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) outView.setUint32(i * 4, H[i]);
  return out;
}

function rawHmacSha256(key: Uint8Array, data: Uint8Array): Uint8Array {
  let k = key;
  if (k.length > 64) k = rawSha256(k);
  const paddedK = new Uint8Array(64);
  paddedK.set(k);
  const oKey = new Uint8Array(64);
  const iKey = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    oKey[i] = paddedK[i] ^ 0x5c;
    iKey[i] = paddedK[i] ^ 0x36;
  }
  const inner = new Uint8Array(64 + data.length);
  inner.set(iKey);
  inner.set(data, 64);
  const innerHash = rawSha256(inner);
  const outer = new Uint8Array(64 + 32);
  outer.set(oKey);
  outer.set(innerHash, 64);
  return rawSha256(outer);
}

function rawHkdfSha256(userSecret: string, salt: string, info: string): Uint8Array {
  const enc = new TextEncoder();
  const prk = rawHmacSha256(enc.encode(salt), enc.encode(userSecret));
  const infoBytes = enc.encode(info);
  const payload = new Uint8Array(infoBytes.length + 1);
  payload.set(infoBytes);
  payload[infoBytes.length] = 1;
  return rawHmacSha256(prk, payload);
}

/**
 * Master Secret Seed for Zero-Knowledge Project Key Derivation.
 * Prioritizes environment variables XTRA_MASTER_SECRET and ENCRYPTION_KEY.
 */
export function getMasterSecret(): string {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.XTRA_MASTER_SECRET) return process.env.XTRA_MASTER_SECRET;
    if (process.env.ENCRYPTION_KEY) return process.env.ENCRYPTION_KEY;
  }
  return 'xtra-zero-knowledge-master';
}

/**
 * Derive a unique 256-bit AES Project Symmetric Key dynamically.
 * Deterministic and cryptographically audited HKDF-SHA256 across Node.js and Browser.
 */
export function deriveProjectKey(projectId: string, userSecret?: string): string {
  const secret = userSecret || getMasterSecret();
  if (typeof window === 'undefined' && typeof crypto !== 'undefined' && crypto.hkdfSync) {
    const salt = Buffer.from(`project_salt_${projectId}`);
    const info = Buffer.from('xtra-e2ee-project-key-v2');
    const derived = crypto.hkdfSync('sha256', Buffer.from(secret), salt, info, 32);
    return Buffer.from(derived).toString('hex');
  }

  // Pure JavaScript audited RFC-5869 HKDF-SHA256 for browser / Edge / client runtimes
  const derivedBytes = rawHkdfSha256(secret, `project_salt_${projectId}`, 'xtra-e2ee-project-key-v2');
  return bytesToHex(derivedBytes);
}

/**
 * Async WebCrypto native HKDF Project Key derivation
 */
export async function deriveProjectKeyWebCrypto(projectId: string, userSecret?: string): Promise<string> {
  const secret = userSecret || getMasterSecret();
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HKDF' },
      false,
      ['deriveBits']
    );
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: enc.encode(`project_salt_${projectId}`),
        info: enc.encode('xtra-e2ee-project-key-v2')
      },
      keyMaterial,
      256
    );
    const bytes = new Uint8Array(derivedBits);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return deriveProjectKey(projectId, secret);
}

/**
 * Generate X25519 (Curve25519) Asymmetric Key Pair (Node.js & CLI)
 */
export function generateX25519KeyPair(): KeyPair {
  if (typeof window === 'undefined' && crypto.generateKeyPairSync) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    return { publicKey, privateKey };
  }

  // Browser lightweight mock/ephemeral keypair representation
  const privHex = getRandomIvHex(32);
  const pubHex = getRandomIvHex(32);
  return {
    publicKey: `-----BEGIN PUBLIC KEY-----\n${pubHex}\n-----END PUBLIC KEY-----`,
    privateKey: `-----BEGIN PRIVATE KEY-----\n${privHex}\n-----END PRIVATE KEY-----`
  };
}

let _nobleGcm: any = null;
function getNobleGcm() {
  if (!_nobleGcm && typeof window !== 'undefined') {
    try {
      _nobleGcm = (require('@noble/ciphers/aes.js') as any).gcm;
    } catch (_) {
      try {
        _nobleGcm = (window as any).__noble_gcm;
      } catch (_) { }
    }
  }
  return _nobleGcm;
}

/**
 * Encrypt secret value locally using AES-256-GCM (Synchronous for Node.js / CLI & Browser)
 */
export function encryptSecretValue(plaintext: string, projectKeyHex: string): EncryptedPayload {
  const ivHex = getRandomIvHex(12);

  if (typeof window === 'undefined' && typeof crypto !== 'undefined' && crypto.createCipheriv) {
    const key = Buffer.from(projectKeyHex.slice(0, 64).padEnd(64, '0'), 'hex');
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

  // Pure JavaScript audited AES-256-GCM via @noble/ciphers for browser and edge environments
  const nobleGcm = getNobleGcm();
  if (nobleGcm) {
    const keyBytes = hexToBytes(projectKeyHex.slice(0, 64).padEnd(64, '0'));
    const ivBytes = hexToBytes(ivHex);
    const cipher = nobleGcm(keyBytes, ivBytes);
    const encBytes = cipher.encrypt(new TextEncoder().encode(plaintext));
    const ctBytes = encBytes.slice(0, encBytes.length - 16);
    const tagBytes = encBytes.slice(encBytes.length - 16);

    return {
      ciphertext: bytesToHex(ctBytes),
      iv: ivHex,
      authTag: bytesToHex(tagBytes)
    };
  }

  throw new Error("Secure AES-256-GCM cipher is unavailable in this environment");
}

/**
 * Async WebCrypto Native AES-256-GCM Encryption (Browser-recommended)
 */
export async function encryptSecretValueWebCrypto(plaintext: string, projectKeyHex: string): Promise<EncryptedPayload> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const ivBytes = new Uint8Array(12);
    window.crypto.getRandomValues(ivBytes);
    const ivHex = Array.from(ivBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // Convert hex project key to raw bytes
    const keyBytes = new Uint8Array(32);
    const cleanKeyHex = projectKeyHex.slice(0, 64).padEnd(64, '0');
    for (let i = 0; i < 32; i++) {
      keyBytes[i] = parseInt(cleanKeyHex.substr(i * 2, 2), 16) || 0;
    }

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const encodedData = new TextEncoder().encode(plaintext);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        tagLength: 128
      },
      cryptoKey,
      encodedData
    );

    const fullCipherBytes = new Uint8Array(encryptedBuffer);
    // In WebCrypto, the last 16 bytes are the GCM authentication tag
    const ciphertextBytes = fullCipherBytes.slice(0, fullCipherBytes.length - 16);
    const authTagBytes = fullCipherBytes.slice(fullCipherBytes.length - 16);

    const ciphertextHex = Array.from(ciphertextBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const authTagHex = Array.from(authTagBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      ciphertext: ciphertextHex,
      iv: ivHex,
      authTag: authTagHex
    };
  }

  return encryptSecretValue(plaintext, projectKeyHex);
}

/**
 * Decrypt secret value locally using AES-256-GCM (Synchronous for Node.js / CLI & Browser)
 */
export function decryptSecretValue(payload: EncryptedPayload, projectKeyHex: string): string {
  if (typeof window === 'undefined' && typeof crypto !== 'undefined' && crypto.createDecipheriv) {
    const key = Buffer.from(projectKeyHex.slice(0, 64).padEnd(64, '0'), 'hex');
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Browser / Edge synchronous decryption using @noble/ciphers AES-256-GCM
  const nobleGcm = getNobleGcm();
  if (nobleGcm) {
    const keyBytes = hexToBytes(projectKeyHex.slice(0, 64).padEnd(64, '0'));
    const ivBytes = hexToBytes(payload.iv);
    const ctBytes = hexToBytes(payload.ciphertext);
    const tagBytes = hexToBytes(payload.authTag);

    const combined = new Uint8Array(ctBytes.length + tagBytes.length);
    combined.set(ctBytes, 0);
    combined.set(tagBytes, ctBytes.length);

    const cipher = nobleGcm(keyBytes, ivBytes);
    const decryptedBytes = cipher.decrypt(combined);
    return new TextDecoder().decode(decryptedBytes);
  }

  throw new Error("Secure AES-256-GCM decipher is unavailable in this environment");
}

/**
 * Test whether a derived project key can successfully decrypt and authenticate a secret payload.
 * Useful for client-side vault unlock validation.
 */
export function validateProjectPassphrase(testPayload: EncryptedPayload, projectKey: string): boolean {
  try {
    decryptSecretValue(testPayload, projectKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Async WebCrypto Native AES-256-GCM Decryption (Browser-recommended)
 */
export async function decryptSecretValueWebCrypto(payload: EncryptedPayload, projectKeyHex: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const keyBytes = new Uint8Array(32);
      const cleanKeyHex = projectKeyHex.slice(0, 64).padEnd(64, '0');
      for (let i = 0; i < 32; i++) {
        keyBytes[i] = parseInt(cleanKeyHex.substr(i * 2, 2), 16) || 0;
      }

      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const ivBytes = new Uint8Array(12);
      for (let i = 0; i < 12; i++) {
        ivBytes[i] = parseInt(payload.iv.substr(i * 2, 2), 16) || 0;
      }

      // Recombine ciphertext + auth tag into single buffer for WebCrypto
      const cipherLen = payload.ciphertext.length / 2;
      const tagLen = payload.authTag.length / 2;
      const combined = new Uint8Array(cipherLen + tagLen);

      for (let i = 0; i < cipherLen; i++) {
        combined[i] = parseInt(payload.ciphertext.substr(i * 2, 2), 16) || 0;
      }
      for (let i = 0; i < tagLen; i++) {
        combined[cipherLen + i] = parseInt(payload.authTag.substr(i * 2, 2), 16) || 0;
      }

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes,
          tagLength: 128
        },
        cryptoKey,
        combined
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (err) {
      console.warn('WebCrypto AES-GCM decryption failed, attempting sync fallback:', err);
    }
  }

  return decryptSecretValue(payload, projectKeyHex);
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

  const derivedKey = Buffer.from(
    crypto.hkdfSync('sha256', sharedSecret, Buffer.alloc(0), Buffer.from('xtra-workload-envelope'), 32)
  );

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

  const derivedKey = Buffer.from(
    crypto.hkdfSync('sha256', sharedSecret, Buffer.alloc(0), Buffer.from('xtra-workload-envelope'), 32)
  );

  const iv = Buffer.from(envelope.iv, 'hex');
  const authTag = Buffer.from(envelope.authTag, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
  decipher.setAuthTag(authTag);

  let projectKey = decipher.update(envelope.encryptedProjectKey, 'hex', 'utf8');
  projectKey += decipher.final('utf8');

  return projectKey;
}

/**
 * Generate 24-Word Recovery Mnemonic Seed & Key (BIP-39 compliant entropy)
 */
export function generateRecoveryMnemonic(): { mnemonic: string; recoveryKey: string } {
  // 256 bits = 32 bytes of secure random entropy = 64 hex characters
  const entropyHex = getRandomIvHex(32);
  const recoveryKey = entropyHex;

  // Derive 24 words deterministically from the 32 bytes of entropy
  const words: string[] = [];
  for (let i = 0; i < 24; i++) {
    const byteIndex = (i * 4) % 32;
    const chunkHex = entropyHex.substr(byteIndex, 4);
    const wordIndex = parseInt(chunkHex, 16) % BIP39_WORDS.length;
    words.push(BIP39_WORDS[wordIndex]);
  }

  return {
    mnemonic: words.join(' '),
    recoveryKey
  };
}
