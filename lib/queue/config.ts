import { ConnectionOptions } from 'bullmq';

const redisUrl = process.env.REDIS_URL;

function parseRedisConnection(urlStr: string): ConnectionOptions | undefined {
  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      tls: urlStr.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: null, // Critical for BullMQ compatibility
      enableOfflineQueue: true,
    };
  } catch (error: any) {
    console.warn(`[Queue] Failed to parse REDIS_URL "${urlStr}". Fallback to undefined.`, error.message);
    return undefined;
  }
}

export const connection: ConnectionOptions | undefined = redisUrl ? parseRedisConnection(redisUrl) : undefined;

if (!connection) {
  console.warn('REDIS_URL not found or invalid. BullMQ will not be able to connect to Redis.');
} else {
  console.log(`[Queue] Initializing connection to ${(connection as any).host}:${(connection as any).port} (TLS: ${!!(connection as any).tls})`);
}
