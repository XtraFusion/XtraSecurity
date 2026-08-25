import * as QRCode from "qrcode";
import crypto from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function computeTotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, "0");
}

/**
 * Generate a new TOTP secret for a user (160-bit base32)
 */
export async function generateMfaSecret(): Promise<string> {
  return base32Encode(crypto.randomBytes(20));
}

/**
 * Generate QR code data URL for authenticator app
 */
export async function generateQrCode(
  email: string,
  secret: string,
  appName: string = "XtraSecurity"
): Promise<string> {
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;
  return QRCode.toDataURL(otpauthUrl);
}

/**
 * Verify TOTP token against secret with +/- 1 time step window tolerance
 */
export async function verifyTotp(token: string, secret: string, window: number = 1): Promise<boolean> {
  if (!token || typeof token !== "string" || token.trim().length !== 6) {
    return false;
  }

  const currentCounter = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    const expected = computeTotp(secret, currentCounter + i);
    if (token.trim() === expected) {
      return true;
    }
  }
  return false;
}

/**
 * Generate a valid TOTP token from secret (for current time step)
 */
export async function generateTotpToken(secret: string, timestamp: number = Date.now()): Promise<string> {
  const currentCounter = Math.floor(timestamp / 1000 / 30);
  return computeTotp(secret, currentCounter);
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
}

/**
 * Verify a backup code against stored hashes
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const hashedInput = hashBackupCode(code);
  const index = hashedCodes.indexOf(hashedInput);
  return index; // Returns -1 if not found, index if found
}

/**
 * Check if MFA is required for a sensitive operation
 */
export function isMfaRequired(
  operation: string,
  environment?: string
): boolean {
  const sensitiveOperations = [
    "production.secrets.write",
    "production.secrets.delete",
    "role.change",
    "project.delete",
    "apikey.create",
    "mfa.disable",
    "user.delete",
  ];

  // Production access always requires MFA
  if (environment === "production") {
    return true;
  }

  return sensitiveOperations.includes(operation);
}
