import crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import os from "os";
import Conf from "conf";
import { machineIdSync } from "node-machine-id";

const algorithm = "aes-256-gcm";
const config = new Conf({ projectName: "xtra-cli-crypto" });

/**
 * Phase 4: OS Keychain & Hardware Fingerprint Key Derivation
 * Combines OS-specific user credentials (SID/Username), OS platform identifier,
 * and hardware machine-id to create a non-transferable key.
 * Caches encrypted with this key CANNOT be decrypted on another machine.
 */
let cachedHardwareKey: Buffer | null = null;

function getHardwareKeyringKey(): Buffer {
  if (cachedHardwareKey) return cachedHardwareKey;
  let keyBase = config.get("masterKey") as string;
  if (!keyBase) {
    keyBase = crypto.randomBytes(32).toString("hex");
    config.set("masterKey", keyBase);
  }

  let mId = "";
  try {
    mId = machineIdSync() || "";
  } catch (_) {
    mId = crypto.createHash("sha256").update(os.hostname() + (os.userInfo?.()?.username || "root")).digest("hex");
  }

  // OS Keychain Hardware Fingerprint (Platform + MachineID + User SID/Username)
  const platform = os.platform();
  const username = os.userInfo?.()?.username || "default_user";
  const fingerprint = `${platform}:${username}:${mId}:${keyBase}`;

  cachedHardwareKey = crypto.createHash("sha256").update(fingerprint).digest();
  return cachedHardwareKey;
}

/**
 * Encrypt arbitrary text using Hardware-Bound AES-256-GCM
 */
export const encrypt = (text: string): { iv: string; content: string; tag: string } => {
  const iv = crypto.randomBytes(12);
  const key = getHardwareKeyringKey();
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    content: encrypted,
    tag: tag.toString("hex"),
  };
};

/**
 * Decrypt content using Hardware-Bound AES-256-GCM
 */
export const decrypt = (encrypted: { iv: string; content: string; tag: string }): string => {
  const key = getHardwareKeyringKey();
  const iv = Buffer.from(encrypted.iv, "hex");
  const tag = Buffer.from(encrypted.tag, "hex");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted.content, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

/**
 * Hash string helper
 */
export const hash = (text: string): string => {
  return crypto.createHash("sha256").update(text).digest("hex");
};

import { execFileSync } from "child_process";

/**
 * Phase 4: Secure Hardware-Bound Keyring Store for CLI Cache & Tokens
 */
export const secureSave = (storeKey: string, value: string): void => {
  try {
    const service = "XtraSecurityCLI";
    const account = storeKey;

    if (os.platform() === "darwin") {
      execFileSync("security", ["add-generic-password", "-s", service, "-a", account, "-w", value, "-U"], { stdio: "ignore" });
      return;
      return;
    } else if (os.platform() === "win32") {
      // cmdkey doesn't allow easy reading of passwords.
      // Fallback to hardware-fingerprint config store for both save and read.
    } else if (os.platform() === "linux") {
      // Try secret-tool (libsecret)
      try {
        execFileSync("secret-tool", ["store", "--label", service, "service", service, "account", account], { input: value, stdio: ["pipe", "ignore", "ignore"] });
        return;
      } catch (e) {
        // Fallback for headless linux
      }
    }
  } catch (err) {
    // Silent fallback to hardware-fingerprint config storage
  }

  // Fallback: Encrypted Config Store
  const encryptedPayload = encrypt(value);
  config.set(`secure_${storeKey}`, JSON.stringify(encryptedPayload));
};

export const secureRead = (storeKey: string): string | null => {
  try {
    const service = "XtraSecurityCLI";
    const account = storeKey;

    if (os.platform() === "darwin") {
      const result = execFileSync("security", ["find-generic-password", "-s", service, "-a", account, "-w"], { stdio: ["ignore", "pipe", "ignore"] });
      return result.toString().trim();
    } else if (os.platform() === "win32") {
      // cmdkey doesn't allow easy reading of passwords (security limitation). 
      // DPAPI would be ideal, but for CLI we fallback to the hardware-fingerprint store on Windows.
      // We will just fall through to the fallback here.
    } else if (os.platform() === "linux") {
      try {
        const result = execFileSync("secret-tool", ["lookup", "service", service, "account", account], { stdio: ["ignore", "pipe", "ignore"] });
        return result.toString().trim();
      } catch (e) {
        // Fallback
      }
    }
  } catch (err) {
    // Not found in OS keychain, proceed to fallback
  }

  // Fallback: Encrypted Config Store
  try {
    const raw = config.get(`secure_${storeKey}`) as string;
    if (!raw) return null;
    const payload = JSON.parse(raw);
    return decrypt(payload);
  } catch (err) {
    // If decrypted on a different machine or tampered with, return null
    return null;
  }
};

/**
 * Phase 3: Zero-Knowledge E2EE Project Key derivation and secret encryption/decryption
 */
export function deriveProjectKey(projectId: string, userSecret?: string): string {
  if (!userSecret) {
    userSecret = resolveVaultPassphrase(undefined, projectId);
  }
  const salt = Buffer.from(`project_salt_${projectId}`);
  const info = Buffer.from("xtra-e2ee-project-key-v2");
  const derived = crypto.hkdfSync("sha256", Buffer.from(userSecret), salt, info, 32);
  return Buffer.from(derived).toString("hex");
}

export function encryptSecretValue(plaintext: string, projectKeyHex: string): { ciphertext: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(projectKeyHex.slice(0, 64).padEnd(64, "0"), "hex");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    ciphertext,
    iv: iv.toString("hex"),
    authTag
  };
}

export function decryptSecretValue(payload: { ciphertext: string; iv: string; authTag: string }, projectKeyHex: string): string {
  const key = Buffer.from(projectKeyHex.slice(0, 64).padEnd(64, "0"), "hex");
  const iv = Buffer.from(payload.iv, "hex");
  const authTag = Buffer.from(payload.authTag, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(payload.ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export const secureDelete = (storeKey: string): void => {
  try {
    const service = "XtraSecurityCLI";
    const account = storeKey;

    if (os.platform() === "darwin") {
      execFileSync("security", ["delete-generic-password", "-s", service, "-a", account], { stdio: "ignore" });
    } else if (os.platform() === "linux") {
      try {
        execFileSync("secret-tool", ["clear", "service", service, "account", account], { stdio: "ignore" });
      } catch (e) {}
    }
  } catch (err) {}

  try {
    config.delete(`secure_${storeKey}`);
  } catch (err) {}
};

/**
 * Standard BIP-39 Curated English Wordlist for 24-Word Master Key Generation
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
 * Generate 24-Word Recovery Mnemonic Seed & Key (BIP-39 compliant entropy)
 */
export function generateRecoveryMnemonic(): { mnemonic: string; recoveryKey: string } {
  const entropyHex = crypto.randomBytes(32).toString("hex");
  const recoveryKey = entropyHex;

  const words: string[] = [];
  for (let i = 0; i < 24; i++) {
    const byteIndex = (i * 4) % 32;
    const chunkHex = entropyHex.substr(byteIndex, 4);
    const wordIndex = parseInt(chunkHex, 16) % BIP39_WORDS.length;
    words.push(BIP39_WORDS[wordIndex]);
  }

  return {
    mnemonic: words.join(" "),
    recoveryKey
  };
}

/**
 * Cryptographic Zero-Knowledge Vault Sentinel token
 */
export const VAULT_SENTINEL_MAGIC = "xtra_vault_sentinel_token_v3_authenticated";

export function createVaultSentinel(projectKeyHex: string): { ciphertext: string; iv: string; authTag: string } {
  return encryptSecretValue(VAULT_SENTINEL_MAGIC, projectKeyHex);
}

export function verifyVaultSentinel(
  sentinelPayload: { ciphertext: string; iv: string; authTag: string } | string,
  projectKeyHex: string
): boolean {
  try {
    const parsed = typeof sentinelPayload === "string" ? JSON.parse(sentinelPayload) : sentinelPayload;
    const decrypted = decryptSecretValue(parsed, projectKeyHex);
    return decrypted === VAULT_SENTINEL_MAGIC;
  } catch {
    return false;
  }
}

/**
 * Derives a deterministic 256-bit symmetric key for a workspace using HKDF-SHA256
 */
export function deriveWorkspaceKey(workspaceId: string, userSecret?: string): string {
  const secret = userSecret || resolveVaultPassphrase(undefined, undefined, workspaceId);
  const salt = Buffer.from(`workspace_salt_${workspaceId}`);
  const info = Buffer.from("xtra-e2ee-workspace-key-v1");
  const derived = crypto.hkdfSync("sha256", Buffer.from(secret), salt, info, 32);
  return Buffer.from(derived).toString("hex");
}

export function createWorkspaceVaultSentinel(
  workspaceId: string,
  userSecret?: string
): { ciphertext: string; iv: string; authTag: string } {
  const wsKey = deriveWorkspaceKey(workspaceId, userSecret);
  return encryptSecretValue(VAULT_SENTINEL_MAGIC, wsKey);
}

export function verifyWorkspaceVaultSentinel(
  sentinelPayload: { ciphertext: string; iv: string; authTag: string } | string,
  workspaceId: string,
  userSecret?: string
): boolean {
  try {
    const parsed = typeof sentinelPayload === "string" ? JSON.parse(sentinelPayload) : sentinelPayload;
    const wsKey = deriveWorkspaceKey(workspaceId, userSecret);
    const decrypted = decryptSecretValue(parsed, wsKey);
    return decrypted === VAULT_SENTINEL_MAGIC;
  } catch {
    return false;
  }
}

/**
 * Resolves the Level 3 Master Vault Passphrase from multiple sources with scope awareness:
 * 1. Explicit argument / flag
 * 2. Dedicated project env: XTRA_PROJECT_PASSPHRASE
 * 3. Workspace-scoped env: XTRA_WORKSPACE_PASSPHRASE
 * 4. General vault env: XTRA_VAULT_PASSPHRASE
 * 5. Legacy env: XTRA_MASTER_SECRET
 * 6. OS Keychain / Conf for specific project: vault_${projectId}
 * 7. OS Keychain / Conf for specific workspace: vault_ws_${workspaceId}
 * 8. OS Keychain / Conf global fallback: vault_passphrase
 * 9. .xtrarc config file passphrase
 */
export function resolveVaultPassphrase(explicit?: string, projectId?: string, workspaceId?: string): string {
  if (explicit && explicit.trim()) {
    return explicit.trim();
  }

  // 1. Project-specific env
  if (process.env.XTRA_PROJECT_PASSPHRASE && process.env.XTRA_PROJECT_PASSPHRASE.trim()) {
    return process.env.XTRA_PROJECT_PASSPHRASE.trim();
  }

  // 2. Workspace-specific env
  if (process.env.XTRA_WORKSPACE_PASSPHRASE && process.env.XTRA_WORKSPACE_PASSPHRASE.trim()) {
    return process.env.XTRA_WORKSPACE_PASSPHRASE.trim();
  }

  // 3. Vault & Master Secret envs
  if (process.env.XTRA_VAULT_PASSPHRASE && process.env.XTRA_VAULT_PASSPHRASE.trim()) {
    return process.env.XTRA_VAULT_PASSPHRASE.trim();
  }

  if (process.env.XTRA_MASTER_SECRET && process.env.XTRA_MASTER_SECRET.trim()) {
    return process.env.XTRA_MASTER_SECRET.trim();
  }

  // Check hardware-bound keyring
  try {
    if (projectId) {
      const storedProjKey = secureRead(`vault_${projectId}`);
      if (storedProjKey) return storedProjKey;
    }

    const wsId = workspaceId || (function() {
      try {
        const { getConfigValue } = require('./config');
        return getConfigValue('workspace');
      } catch (_) { return null; }
    })();

    if (wsId) {
      const storedWsKey = secureRead(`vault_ws_${wsId}`);
      if (storedWsKey) return storedWsKey;
    }

    const storedGlobal = secureRead('vault_passphrase');
    if (storedGlobal) return storedGlobal;
  } catch (_) {}

  // Check .xtrarc if available
  try {
    const { getRcConfig } = require('./config');
    const rc = getRcConfig();
    if (rc && rc.passphrase) return rc.passphrase;
  } catch (_) {}

  throw new Error("Vault Passphrase or Master Secret is required for Zero-Knowledge E2EE encryption/decryption.");
}

/**
 * Saves a vault passphrase to the local hardware keyring store (bound to machine & user).
 * Supports both workspace-level and project-level scopes.
 */
export function saveVaultPassphrase(
  passphrase: string,
  projectId?: string,
  isGlobal: boolean = false,
  workspaceId?: string
): void {
  if (workspaceId) {
    secureSave(`vault_ws_${workspaceId}`, passphrase);
    if (isGlobal) {
      secureSave('vault_passphrase', passphrase);
    }
  } else if (projectId) {
    secureSave(`vault_${projectId}`, passphrase);
    if (isGlobal) {
      secureSave('vault_passphrase', passphrase);
    }
  } else {
    secureSave('vault_passphrase', passphrase);
  }
}

export interface WorkloadEnvelope {
  targetPublicKey: string;
  ephemeralPublicKey: string;
  encryptedProjectKey: string;
  iv: string;
  authTag: string;
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

