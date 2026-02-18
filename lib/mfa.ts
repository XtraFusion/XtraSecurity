import * as QRCode from "qrcode";
import crypto from "crypto";

async function getAuthenticator() {
  const otplib = await import("otplib");
  const authenticator: any = (otplib as any).authenticator ?? (otplib as any).default?.authenticator ?? otplib;
  if (authenticator && typeof authenticator === "object") {
    authenticator.options = {
      window: 1,
      step: 30,
    };
  }
  return authenticator;
}

/**
 * Generate a new TOTP secret for a user
 */
export async function generateMfaSecret(): Promise<string> {
  const authenticator = await getAuthenticator();
  return authenticator.generateSecret();
}

/**
 * Generate QR code data URL for authenticator app
 */
export async function generateQrCode(
  email: string,
  secret: string,
  appName: string = "XtraSync"
): Promise<string> {
  const authenticator = await getAuthenticator();
  const otpauthUrl = authenticator.keyuri(email, appName, secret);
  return QRCode.toDataURL(otpauthUrl);
}

/**
 * Verify TOTP token
 */
export async function verifyTotp(token: string, secret: string): Promise<boolean> {
  try {
    const authenticator = await getAuthenticator();
    if (typeof authenticator.check === "function") {
      return !!authenticator.check(token, secret);
    }
    if (typeof authenticator.verify === "function") {
      return !!authenticator.verify({ token, secret });
    }
    return false;
  } catch {
    return false;
  }
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
