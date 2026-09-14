/**
 * Standardized encryption alias module.
 * Re-exports core AES-256-GCM functions from lib/encription.ts
 * ensuring backward compatibility and conventional naming.
 */

export * from "./encription";
export { encrypt, decrypt } from "./encription";
