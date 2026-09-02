import { redis, redisPub, redisSub } from '@/lib/redis';
import { PolicyEngine } from './policy-engine';
import { AccessRequest, Decision } from './types';

const CHANNEL_INVALIDATE = 'authz:cache:invalidate';
const LOCAL_CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory fallback

interface LocalCacheEntry {
  decision: Decision;
  expiresAt: number;
}

const localPolicyCache = new Map<string, LocalCacheEntry>();

// Subscribe to Redis Pub/Sub for cross-instance instant cache invalidation
if (redisSub) {
  try {
    redisSub.subscribe(CHANNEL_INVALIDATE, (err, count) => {
      if (err) {
        console.error('[Authz Cache] Pub/Sub subscription error:', err);
      } else {
        console.log(`[Authz Cache] Subscribed to invalidation channel '${CHANNEL_INVALIDATE}'`);
      }
    });

    redisSub.on('message', (channel, message) => {
      if (channel === CHANNEL_INVALIDATE) {
        try {
          const { cacheKey, userId } = JSON.parse(message);
          if (cacheKey) {
            localPolicyCache.delete(cacheKey);
          }
          if (userId) {
            // Clear any local key starting with this userId
            for (const key of localPolicyCache.keys()) {
              if (key.startsWith(`policy:${userId}:`)) {
                localPolicyCache.delete(key);
              }
            }
          }
        } catch (e) {
          console.error('[Authz Cache] Invalid pub/sub payload:', message);
        }
      }
    });
  } catch (err) {
    console.error('[Authz Cache] Setup failed:', err);
  }
}

function buildCacheKey(req: AccessRequest): string {
  return `policy:${req.userId}:${req.projectId || 'global'}:${req.resource}:${req.action}:${req.environment || 'all'}`;
}

export async function getCachedPolicyDecision(req: AccessRequest): Promise<Decision> {
  const cacheKey = buildCacheKey(req);

  // 1. Check local in-memory cache
  const localEntry = localPolicyCache.get(cacheKey);
  if (localEntry && localEntry.expiresAt > Date.now()) {
    return localEntry.decision;
  }

  // 2. Check Redis cache
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const decision = cached as Decision;
        localPolicyCache.set(cacheKey, { decision, expiresAt: Date.now() + LOCAL_CACHE_TTL_MS });
        return decision;
      }
    } catch (e) {
      // Ignore Redis errors and fall through to PolicyEngine evaluation
    }
  }

  // 3. Evaluate Policy via DB
  const decision = await PolicyEngine.authorize(req);

  // 4. Cache the decision (5 minute TTL in Redis, 1 min local)
  localPolicyCache.set(cacheKey, { decision, expiresAt: Date.now() + LOCAL_CACHE_TTL_MS });

  if (redis) {
    try {
      await redis.set(cacheKey, decision, 'EX', 300); // 5 min TTL
    } catch (e) {
      // Ignore write errors
    }
  }

  return decision;
}

export async function invalidateUserPolicyCache(userId: string, projectId?: string): Promise<void> {
  // Clear local instance entries
  for (const key of localPolicyCache.keys()) {
    if (key.startsWith(`policy:${userId}:`)) {
      localPolicyCache.delete(key);
    }
  }

  const payload = JSON.stringify({ userId, projectId });

  // Clear Redis Keys if pattern search available
  if (redis) {
    try {
      const keys = await redis.keys(`policy:${userId}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (e) {
      console.error('[Authz Cache] Failed to clear Redis keys:', e);
    }
  }

  // Publish to Redis Pub/Sub for all other API server instances
  if (redisPub) {
    try {
      await redisPub.publish(CHANNEL_INVALIDATE, payload);
    } catch (e) {
      console.error('[Authz Cache] Failed to publish invalidation event:', e);
    }
  }
}
