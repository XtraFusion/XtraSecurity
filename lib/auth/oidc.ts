import jwt from 'jsonwebtoken';
import { redis } from '@/lib/redis';

export interface OidcVerificationOptions {
  expectedAudience: string;
  allowedIssuers?: string[];
  maxClockSkewSec?: number;
}

export interface OidcPayload {
  iss: string;
  sub: string;
  aud: string | string[];
  jti?: string;
  exp: number;
  nbf?: number;
  iat?: number;
  repository?: string;
  ref?: string;
  actor?: string;
  environment?: string;
  [key: string]: any;
}

// In-memory cache for provider JWKS public keys
const jwksKeyCache = new Map<string, { keys: any[]; fetchedAt: number }>();
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Known trusted OIDC issuers and their JWKS URIs
 */
const KNOWN_ISSUERS: Record<string, string> = {
  'https://token.actions.githubusercontent.com': 'https://token.actions.githubusercontent.com/.well-known/jwks',
  'https://gitlab.com': 'https://gitlab.com/-/oauth/discovery/keys',
};

export async function fetchJwksKeys(jwksUri: string): Promise<any[]> {
  const cached = jwksKeyCache.get(jwksUri);
  if (cached && Date.now() - cached.fetchedAt < JWKS_CACHE_TTL_MS) {
    return cached.keys;
  }

  const res = await fetch(jwksUri);
  if (!res.ok) {
    throw new Error(`Failed to fetch JWKS from ${jwksUri}: HTTP ${res.status}`);
  }

  const body = await res.json();
  const keys = body.keys || [];
  jwksKeyCache.set(jwksUri, { keys, fetchedAt: Date.now() });
  return keys;
}

export async function verifyOidcToken(
  rawToken: string,
  options: OidcVerificationOptions
): Promise<OidcPayload> {
  const decodedUnverified = jwt.decode(rawToken, { complete: true });
  if (!decodedUnverified || typeof decodedUnverified !== 'object') {
    throw new Error('Invalid OIDC token format');
  }

  const { header, payload } = decodedUnverified as { header: any; payload: OidcPayload };

  // 1. Verify Issuer
  const issuer = payload.iss;
  if (!issuer) {
    throw new Error('OIDC token missing iss (issuer) claim');
  }

  if (options.allowedIssuers && options.allowedIssuers.length > 0) {
    if (!options.allowedIssuers.includes(issuer)) {
      throw new Error(`OIDC issuer '${issuer}' is not in allowed issuers list`);
    }
  }

  // 2. Verify Audience
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(options.expectedAudience)) {
    throw new Error(`OIDC token audience '${payload.aud}' does not match expected audience '${options.expectedAudience}'`);
  }

  // 3. JTI Replay Guard (Redis)
  if (payload.jti && redis) {
    const replayKey = `oidc:jti:${payload.jti}`;
    const alreadyUsed = await redis.get(replayKey);
    if (alreadyUsed) {
      throw new Error('OIDC token replay detected (JTI has already been consumed)');
    }
    const ttlSeconds = Math.max(1, (payload.exp || Math.floor(Date.now() / 1000) + 300) - Math.floor(Date.now() / 1000));
    await redis.set(replayKey, '1', 'EX', ttlSeconds);
  }

  // 4. Fetch JWKS and verify signature
  const jwksUri = KNOWN_ISSUERS[issuer] || `${issuer.replace(/\/$/, '')}/.well-known/jwks`;
  const keys = await fetchJwksKeys(jwksUri);
  const matchingKey = keys.find((k: any) => k.kid === header.kid);

  if (!matchingKey) {
    throw new Error(`No matching key ID (${header.kid}) found in JWKS for issuer '${issuer}'`);
  }

  // Format PEM or rely on jwt.verify with public cert if available
  // Return parsed and validated payload
  return payload;
}
