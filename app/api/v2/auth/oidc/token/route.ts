import { NextRequest, NextResponse } from 'next/server';
import { verifyOidcToken } from '@/lib/auth/oidc';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_KEY || 'default-xtra-jwt-secret';

/**
 * POST /api/v2/auth/oidc/token
 * Accepts third-party OIDC JWT (GitHub Actions, GitLab CI, Kubernetes)
 * Returns a 5-minute ephemeral access token + encrypted workload key envelope for zero-knowledge decryption.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { oidcToken, projectId, expectedAudience = 'https://api.xtrasecurity.com' } = body;

    if (!oidcToken) {
      return NextResponse.json(
        { error: 'Missing required field: oidcToken' },
        { status: 400 }
      );
    }

    // 1. Verify OIDC JWT Signature, Expiry, Audience & Replay
    const decodedPayload = await verifyOidcToken(oidcToken, {
      expectedAudience,
      maxClockSkewSec: 60
    });

    // 2. Derive Machine Identity Claims
    const workloadId = decodedPayload.sub;
    const repo = decodedPayload.repository || decodedPayload.sub;

    // 3. Generate Ephemeral Access Token (5-minute TTL)
    const ephemeralToken = jwt.sign(
      {
        sub: `workload_${workloadId}`,
        type: 'oidc_workload',
        projectId,
        repository: repo,
        iss: 'xtrasecurity-api-v2'
      },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    // 4. Generate Workload Envelope if workload public key is provided
    let envelope = null;
    if (body.workloadPublicKey && projectId) {
      try {
        const { deriveProjectKey, createWorkloadKeyEnvelope } = await import('@/lib/crypto/e2ee');
        const projectKey = deriveProjectKey(projectId);
        envelope = createWorkloadKeyEnvelope(projectKey, body.workloadPublicKey);
      } catch (envErr: any) {
        console.warn('[OIDC] Could not generate workload key envelope:', envErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      tokenType: 'Bearer',
      expiresIn: 300, // 5 minutes
      accessToken: ephemeralToken,
      workload: {
        id: workloadId,
        repository: repo,
        issuer: decodedPayload.iss
      },
      envelope
    });
  } catch (error: any) {
    console.error('[API v2 OIDC] Authentication failed:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'OIDC Authentication Failed' },
      { status: 401 }
    );
  }
}
