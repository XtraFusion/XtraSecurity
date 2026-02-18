import prisma from '@/lib/db';
import { randomUUID } from 'crypto';

export interface SecurityEventLog {
  userId?: string;
  userEmail?: string;
  tier?: string;
  apiKeyId?: string;
  
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  city?: string;

  method: string;
  endpoint: string;
  statusCode: number;
  duration: number; // ms
  
  workspaceId?: string;
  projectId?: string;
  environment?: string;
  
  isAnomaly?: boolean;
  rateLimitHit?: boolean;
  riskFactors?: string[];
  errorMessage?: string;
}

export async function logSecurityEvent(data: SecurityEventLog) {
  try {
    // Fire and forget (don't await if performance critical, but for now await to ensure log)
    // Actually, for performance <10ms requirement, we should maybe not await?
    // But Vercel/Serverless functions freeze after response. So we MUST await or use waitUntil.
    // Since we are in Node.js API routes, awaiting adds latency.
    // If using Vercel, use `waitUntil`. But standard Node.js, we can fire and forget if process stays alive.
    // Safest is to await. Optimizing DB write is better.

    await prisma.securityEvent.create({
      data: {
        eventId: randomUUID(),
        timestamp: new Date(),
        
        userId: data.userId,
        userEmail: data.userEmail,
        tier: data.tier,
        apiKeyId: data.apiKeyId,
        
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        country: data.country,
        city: data.city,
        
        method: data.method,
        endpoint: data.endpoint,
        
        statusCode: data.statusCode,
        duration: data.duration,
        errorMessage: data.errorMessage,
        
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        environment: data.environment,
        
        isAnomaly: data.isAnomaly || false,
        rateLimitHit: data.rateLimitHit || false,
        riskFactors: data.riskFactors || [],
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't crash the request
  }
}
