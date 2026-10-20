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

/**
 * Resolves the Level 3 Master Vault Passphrase from multiple sources:
 * 1. Explicit argument / flag
 * 2. Environment variable XTRA_VAULT_PASSPHRASE
 * 3. Local OS Hardware Keyring (stored locally via secureRead)
 * 4. .xtrarc config file
 * 5. Fallback legacy default seed ("xtra-zero-knowledge-master")
 */
export function resolveVaultPassphrase(explicit?: string, projectId?: string): string {
  if (explicit && explicit.trim()) {
    return explicit.trim();
  }

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
 * If projectId is provided without isGlobal=true, it is saved strictly as a project-specific key,
 * preventing clobbering of the global/workspace fallback passphrase.
 */
export function saveVaultPassphrase(passphrase: string, projectId?: string, isGlobal: boolean = false): void {
  if (projectId) {
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

