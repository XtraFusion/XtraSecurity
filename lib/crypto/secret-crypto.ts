/**
 * Secret Cryptographic Strategy & Decryption Pipeline
 * Adheres to Single Responsibility (SRP) and Open/Closed (OCP) principles.
 */

import { encrypt, decrypt } from "@/lib/encription";
import { decryptSecretValue, deriveProjectKey } from "@/lib/crypto/e2ee";

export interface DecryptedSecret {
  id: string;
  key: string;
  value: string;
  history?: any[];
  isJit?: boolean;
  expiresAt?: string | Date | null;
  [key: string]: any;
}

export class SecretCryptoStrategy {
  /**
   * Encrypts a plaintext secret value for database storage.
   * Returns a JSON-serialized string of the encrypted payload.
   */
  public static encryptValue(value: string): string {
    const encrypted = encrypt(value);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypts an encrypted secret value, intelligently resolving either:
   * 1. Standard server AES-256-GCM payload ({ iv, encryptedData, authTag })
   * 2. Project-derived E2EE payload ({ ciphertext, iv })
   * 3. Plaintext fallback
   */
  public static decryptValue(rawVal: any, projectId: string): string {
    if (!rawVal) return "";

    const val = Array.isArray(rawVal) ? rawVal[0] : rawVal;
    if (typeof val !== "string") {
      return String(val ?? "");
    }

    if (!val.startsWith("{")) {
      return val;
    }

    try {
      const parsed = JSON.parse(val);

      // Strategy 1: Server AES-256-GCM
      if (parsed.iv && parsed.encryptedData && parsed.authTag) {
        return decrypt(parsed);
      }

      // Strategy 2: Project-derived E2EE
      if (parsed.ciphertext && parsed.iv) {
        const projectKey = deriveProjectKey(projectId);
        return decryptSecretValue(parsed, projectKey, projectId);
      }

      return val;
    } catch (err) {
      console.error(`[SecretCryptoStrategy] Decryption error for project ${projectId}:`, err);
      return val || "[Decryption failed]";
    }
  }

  /**
   * Decrypts all historical versions of a secret.
   */
  public static decryptHistory(history: any[], projectId: string): any[] {
    if (!Array.isArray(history)) return [];

    return history.map((item) => {
      try {
        let val = item.value;
        if (Array.isArray(val) && val.length > 0) {
          val = val[0];
        }

        if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
          try {
            const parsed = JSON.parse(val);

            // Standard object
            if (parsed.iv && parsed.encryptedData && parsed.authTag) {
              val = decrypt(parsed);
            } else if (parsed.ciphertext && parsed.iv) {
              const projectKey = deriveProjectKey(projectId);
              val = decryptSecretValue(parsed, projectKey, projectId);
            } else if (Array.isArray(parsed) && parsed.length > 0) {
              const inner = JSON.parse(parsed[0]);
              if (inner && inner.iv && inner.encryptedData && inner.authTag) {
                val = decrypt(inner);
              } else if (inner && inner.ciphertext && inner.iv) {
                const projectKey = deriveProjectKey(projectId);
                val = decryptSecretValue(inner, projectKey, projectId);
              }
            }
          } catch (_) {
            // Leave val as is if inner JSON parse fails
          }
        }

        return { ...item, value: val };
      } catch (_) {
        return item;
      }
    });
  }

  /**
   * Masks a secret value for secure response returns (e.g. POST/PUT return "[encrypted]")
   */
  public static maskSecret(secret: any, mask: string = "[encrypted]"): any {
    return {
      ...secret,
      value: mask,
    };
  }

  /**
   * Redacts secret value and history for viewers without active JIT elevation.
   */
  public static redactForViewer(secret: any): any {
    return {
      ...secret,
      value: "[REDACTED]",
      history: [],
    };
  }
}
