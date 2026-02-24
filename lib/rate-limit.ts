import { RateLimiterMemory, RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { 
  Tier, 
  RateLimitResult, 
  DAILY_LIMITS, 
  BURST_LIMITS 
} from './rate-limit-config';

export type { Tier, RateLimitResult };

declare global {
  var _rateLimiterDaily: RateLimiterRedis | RateLimiterMemory | undefined;
  var _rateLimiterBurst: RateLimiterRedis | RateLimiterMemory | undefined;
}

const redisUrl = process.env.REDIS_URL;

const MAX_POINTS = 999999999; 

if (!global._rateLimiterDaily || !global._rateLimiterBurst) {
  if (redisUrl) {
    console.log('Initializing Rate Limiter with Redis');
    const redisClient = new Redis(redisUrl, {
      enableOfflineQueue: false,
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
    });

    redisClient.on('error', (err) => {});

    global._rateLimiterDaily = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_daily',
      points: MAX_POINTS,
      duration: 86400, // 24h
    });

    global._rateLimiterBurst = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_burst',
      points: MAX_POINTS,
      duration: 60, // 1m
    });

  } else {
    console.log('Initializing Rate Limiter with Memory (No REDIS_URL found)');
    global._rateLimiterDaily = new RateLimiterMemory({
      keyPrefix: 'rl_daily',
      points: MAX_POINTS,
      duration: 86400,
    });
    global._rateLimiterBurst = new RateLimiterMemory({
      keyPrefix: 'rl_burst',
      points: MAX_POINTS,
      duration: 60,
    });
  }
}

export const rateLimiterDaily = global._rateLimiterDaily!;
export const rateLimiterBurst = global._rateLimiterBurst!;

export async function checkRateLimit(userId: string, tier: Tier = 'free'): Promise<RateLimitResult> {
  const dailyConfig = DAILY_LIMITS[tier];
  const burstConfig = BURST_LIMITS[tier];

  try {
    // 1. Check Burst (Minute)
    const burstRes = await rateLimiterBurst.consume(userId, 1);
    
    if (burstRes.consumedPoints > burstConfig.points) {
       return {
         success: false,
         limit: burstConfig.points,
         remaining: 0,
         reset: Math.floor(Date.now() / 1000) + Math.round(burstRes.msBeforeNext / 1000),
         tier
       };
    }

    // 2. Check Daily
    const dailyRes = await rateLimiterDaily.consume(userId, 1);

    if (dailyRes.consumedPoints > dailyConfig.points) {
        return {
            success: false,
            limit: dailyConfig.points,
            remaining: 0,
            reset: Math.floor(Date.now() / 1000) + Math.round(dailyRes.msBeforeNext / 1000),
            tier
        };
    }

    return {
        success: true,
        limit: dailyConfig.points,
        remaining: Math.max(0, dailyConfig.points - dailyRes.consumedPoints),
        reset: Math.floor(Date.now() / 1000) + Math.round(dailyRes.msBeforeNext / 1000),
        tier
    };

  } catch (err: any) {
    if (err && err.message && !err.message.includes("Stream isn't writeable")) {
        console.error('Rate Limit Error:', err);
    }
    return {
        success: true,
        limit: dailyConfig.points,
        remaining: 1,
        reset: 0,
        tier
    };
  }
}

export async function getRateLimitStats(userId: string, tier: Tier = 'free'): Promise<RateLimitResult> {
  const dailyConfig = DAILY_LIMITS[tier];
  
  try {
    const dailyRes = await rateLimiterDaily.get(userId);
    
    return {
      success: true,
      limit: dailyConfig.points,
      remaining: dailyRes ? Math.max(0, dailyConfig.points - dailyRes.consumedPoints) : dailyConfig.points,
      reset: dailyRes ? Math.floor(Date.now() / 1000) + Math.round(dailyRes.msBeforeNext / 1000) : 0,
      tier
    };

  } catch (err: any) {
    if (err && err.message && !err.message.includes("Stream isn't writeable")) {
        console.error('Rate Limit Stats Error:', err);
    }
    return {
        success: true,
        limit: dailyConfig.points,
        remaining: dailyConfig.points,
        reset: 0,
        tier
    };
  }
}
