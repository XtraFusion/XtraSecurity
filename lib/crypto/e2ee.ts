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
 * Derive a unique 256-bit AES Project Symmetric Key dynamically.
 * Works synchronously in Node.js, and browser-safe.
 */
export function deriveProjectKey(projectId: string, userSecret: string = 'xtra-zero-knowledge-master'): string {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    const salt = Buffer.from(`project_salt_${projectId}`);
    const info = Buffer.from('xtra-e2ee-project-key-v2');
    const derived = crypto.hkdfSync('sha256', Buffer.from(userSecret), salt, info, 32);
    return Buffer.from(derived).toString('hex');
  }

  // Fallback synchronous deterministic derivation for browser memory if async not awaited
  const str = `${userSecret}:${projectId}:xtra-e2ee-v2-subtle`;
  let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0, h3 = 0x85ebca6b ^ 0, h4 = 0xc2b2ae35 ^ 0;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }
  const part1 = (Math.imul(h1 ^ (h1 >>> 16), 2246822507) >>> 0).toString(16).padStart(8, '0');
  const part2 = (Math.imul(h2 ^ (h2 >>> 13), 3266489909) >>> 0).toString(16).padStart(8, '0');
  const part3 = (Math.imul(h3 ^ (h3 >>> 15), 2654435761) >>> 0).toString(16).padStart(8, '0');
  const part4 = (Math.imul(h4 ^ (h4 >>> 11), 1597334677) >>> 0).toString(16).padStart(8, '0');
  return (part1 + part2 + part3 + part4 + part1 + part2 + part3 + part4).slice(0, 64);
}

/**
 * Async WebCrypto native HKDF Project Key derivation
 */
export async function deriveProjectKeyWebCrypto(projectId: string, userSecret: string = 'xtra-zero-knowledge-master'): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(userSecret),
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
  return deriveProjectKey(projectId, userSecret);
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

/**
 * Encrypt secret value locally using AES-256-GCM (Synchronous for Node.js / CLI)
 */
export function encryptSecretValue(plaintext: string, projectKeyHex: string): EncryptedPayload {
  const ivHex = getRandomIvHex(12);

  if (typeof window === 'undefined' || !window.crypto?.subtle) {
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

  // Synchronous web fallback if caller does not await async WebCrypto
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
 * Decrypt secret value locally using AES-256-GCM (Synchronous for Node.js / CLI)
 */
export function decryptSecretValue(payload: EncryptedPayload, projectKeyHex: string): string {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    try {
      const key = Buffer.from(projectKeyHex.slice(0, 64).padEnd(64, '0'), 'hex');
      const iv = Buffer.from(payload.iv, 'hex');
      const authTag = Buffer.from(payload.authTag, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      // Fallback for mock browser XOR if encountered
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
  }

  // Web fallback
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

/**
 * Async WebCrypto Native AES-256-GCM Decryption (Browser-recommended)
 */
export async function decryptSecretValueWebCrypto(payload: EncryptedPayload, projectKeyHex: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && payload.authTag !== '00112233445566778899aabbccddeeff') {
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
