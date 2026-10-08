import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyOidcToken } from '@/lib/auth/oidc';
import * as crypto from 'crypto';
import { redis } from '@/lib/redis';

import { rateLimit, getClientIp } from '@/lib/rate-limit';
import * as zlib from 'zlib';

export async function POST(req: Request) {
  try {
    // 20 requests per minute per IP for OIDC (CI/CD environments)
    const ip = getClientIp(req as any);
    const rateLimitResult = await rateLimit(ip, 'oidc_token', 20, 60);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many OIDC requests. Please try again later.' },
        { 
          status: 429, 
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      );
    }

    const body = await req.json();
    const { provider, token } = body;

    if (!provider || !token) {
      return NextResponse.json({ error: 'Missing provider or token' }, { status: 400 });
    }

    // 1. Verify the OIDC Token signature and replay protection
    const verification = await verifyOidcToken(token, provider);
    
    if (!verification.isValid || !verification.subject) {
      return NextResponse.json({ error: verification.error || 'Invalid token' }, { status: 401 });
    }

    const { subject } = verification;

    // 2. Find matching OidcTrustPolicy
    // Since we need to match the subject which might be complex, we fetch all policies for this provider
    // and see if the token's subject satisfies one.
    // E.g. GitHub sub: repo:XtraFusion/MyFrontendApp:ref:refs/heads/main
    
    const policies = await prisma.oidcTrustPolicy.findMany({
      where: { provider },
      include: { project: true }
    });

    const matchedPolicy = policies.find(p => {
      if (provider === 'github') {
        // match "repo:org/repo:..."
        return subject.startsWith(`repo:${p.subject}:`);
      }
      if (provider === 'gitlab') {
        // match "project_path:org/repo:..."
        return subject.startsWith(`project_path:${p.subject}:`);
      }
      return subject === p.subject;
    });

    if (!matchedPolicy) {
      return NextResponse.json({ error: 'No trust policy matches this workload identity' }, { status: 403 });
    }

    // 3. Generate Ephemeral Token (5-minute TTL) with CRC32 Checksum (SEC-002)
    const rawEntropy = crypto.randomBytes(32).toString('hex');
    const checksum = zlib.crc32(rawEntropy).toString(16).padStart(8, '0');
    const ephemeralToken = `xtra_eph_${rawEntropy}${checksum}`;
    
    const tokenKey = `ephemeral_token:${ephemeralToken}`;
    
    // Store in Redis with 5 min expiry
    const tokenData = {
      projectId: matchedPolicy.projectId,
      environmentType: matchedPolicy.environmentType,
      branchName: matchedPolicy.branchName,
      policyId: matchedPolicy.id,
      createdAt: Date.now()
    };
    
    await redis.setex(tokenKey, 300, JSON.stringify(tokenData));

    // Audit log
    await prisma.securityEvent.create({
      data: {
        eventId: crypto.randomUUID(),
        method: 'POST',
        endpoint: '/api/v2/auth/oidc/token',
        statusCode: 200,
        duration: 0,
        projectId: matchedPolicy.projectId,
        environment: matchedPolicy.environmentType,
        errorMessage: `OIDC Token issued for ${provider} workload: ${subject}`
      }
    });

    return NextResponse.json({
      access_token: ephemeralToken,
      token_type: 'Bearer',
      expires_in: 300,
      project: {
        id: matchedPolicy.projectId,
        environment: matchedPolicy.environmentType,
        branch: matchedPolicy.branchName
      },
      envelope: matchedPolicy.workloadPublicKey ? {
        targetPublicKey: matchedPolicy.workloadPublicKey,
        encryptedProjectKey: matchedPolicy.encryptedProjectKey,
        iv: matchedPolicy.envelopeIv,
        authTag: matchedPolicy.envelopeAuthTag
      } : null
    });
  } catch (error: any) {
    console.error('OIDC Token Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
