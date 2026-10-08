import { redis } from '@/lib/redis';
import { NextRequest } from 'next/server';
import { Tier, DAILY_LIMITS, RateLimitResult as ConfigRateLimitResult } from './rate-limit-config';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * A Fixed Window Rate Limiter using Redis.
 * @param key Unique identifier (e.g., IP address or user ID)
 * @param action Name of the action (e.g., "login", "api_call")
 * @param limit Maximum number of requests allowed in the window
 * @param windowSeconds Duration of the window in seconds
 */
export async function rateLimit(
  key: string,
  action: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (!redis) {
    // Graceful fallback if Redis is not configured (e.g., local development without Redis)
    return { success: true, limit, remaining: limit - 1, reset: Date.now() + windowSeconds * 1000 };
  }

  const now = Math.floor(Date.now() / 1000);
  const currentWindow = Math.floor(now / windowSeconds);
  const redisKey = `ratelimit:${action}:${key}:${currentWindow}`;

  try {
    const pipeline = redis.pipeline();
    pipeline.incr(redisKey);
    pipeline.expire(redisKey, windowSeconds * 2); // Ensure cleanup

    const results = await pipeline.exec();
    
    // results[0][1] contains the result of the INCR command
    const count = results?.[0]?.[1] as number || 1;

    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      reset: (currentWindow + 1) * windowSeconds * 1000
    };
  } catch (error) {
    console.error('Rate Limiter Error:', error);
    // Fail open to avoid blocking legitimate users if Redis hiccups
    return { success: true, limit, remaining: limit - 1, reset: Date.now() + windowSeconds * 1000 };
  }
}

/**
 * Extracts the client IP from a NextRequest.
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return '127.0.0.1'; // Fallback
}

export async function checkRateLimit(
  userId: string,
  tier: Tier
): Promise<ConfigRateLimitResult> {
  const config = DAILY_LIMITS[tier] || DAILY_LIMITS.free;
  
  const res = await rateLimit(userId, "api_call", config.points, config.duration);
  
  return {
    success: res.success,
    limit: res.limit,
    remaining: res.remaining,
    reset: res.reset,
    tier
  };
}

export async function getRateLimitStats(
  userId: string,
  tier: Tier
): Promise<ConfigRateLimitResult> {
  const config = DAILY_LIMITS[tier] || DAILY_LIMITS.free;
  if (!redis) {
    return { success: true, limit: config.points, remaining: config.points, reset: Date.now() + config.duration * 1000, tier };
  }
  const now = Math.floor(Date.now() / 1000);
  const currentWindow = Math.floor(now / config.duration);
  const redisKey = `ratelimit:api_call:${userId}:${currentWindow}`;
  
  try {
    const countStr = await redis.get(redisKey);
    const count = countStr ? parseInt(countStr, 10) : 0;
    return {
      success: count <= config.points,
      limit: config.points,
      remaining: Math.max(0, config.points - count),
      reset: (currentWindow + 1) * config.duration * 1000,
      tier
    };
  } catch (error) {
    console.error('getRateLimitStats Error:', error);
    return { success: true, limit: config.points, remaining: config.points, reset: Date.now() + config.duration * 1000, tier };
  }
}

