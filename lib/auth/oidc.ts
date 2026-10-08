import * as jose from 'jose';
import { redis } from '@/lib/redis';

export interface OidcVerificationResult {
  isValid: boolean;
  subject?: string;
  audience?: string;
  issuer?: string;
  error?: string;
}

const PROVIDER_JWKS_URLS: Record<string, string> = {
  github: 'https://token.actions.githubusercontent.com/.well-known/jwks',
  gitlab: 'https://gitlab.com/-/jwks',
};

const PROVIDER_ISSUERS: Record<string, string> = {
  github: 'https://token.actions.githubusercontent.com',
  gitlab: 'https://gitlab.com',
};

export async function verifyOidcToken(
  token: string,
  provider: string,
  expectedAudience: string = 'https://api.xtrasecurity.com'
): Promise<OidcVerificationResult> {
  try {
    const jwksUrl = PROVIDER_JWKS_URLS[provider];
    const expectedIssuer = PROVIDER_ISSUERS[provider];

    if (!jwksUrl || !expectedIssuer) {
      return { isValid: false, error: 'Unsupported OIDC provider' };
    }

    const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));

    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: expectedIssuer,
      audience: expectedAudience,
      clockTolerance: 60, // 60 seconds tolerance
    });

    const jti = payload.jti;
    if (jti) {
      // Replay protection: check if JTI exists in Redis
      const jtiKey = `oidc:jti:${jti}`;
      const exists = await redis.get(jtiKey);
      if (exists) {
        return { isValid: false, error: 'Token replay detected (JTI already used)' };
      }
      
      // Store JTI with TTL matching token expiration
      const exp = payload.exp;
      if (exp) {
        const ttl = Math.max(1, exp - Math.floor(Date.now() / 1000));
        await redis.setex(jtiKey, ttl, 'used');
      }
    }

    return {
      isValid: true,
      subject: payload.sub,
      audience: typeof payload.aud === 'string' ? payload.aud : payload.aud?.[0],
      issuer: payload.iss,
    };
  } catch (error: any) {
    return { isValid: false, error: error.message };
  }
}
