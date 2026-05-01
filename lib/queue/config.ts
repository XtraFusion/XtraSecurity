import { ConnectionOptions } from 'bullmq';

const redisUrl = process.env.REDIS_URL;

export const connection: ConnectionOptions | undefined = redisUrl ? {
  host: new URL(redisUrl).hostname,
  port: parseInt(new URL(redisUrl).port || '6379'),
  password: new URL(redisUrl).password || undefined,
  username: new URL(redisUrl).username || undefined,
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  maxRetriesPerRequest: null, // Critical for BullMQ compatibility
  enableOfflineQueue: true,
} : undefined;

if (!connection) {
  console.warn('REDIS_URL not found. BullMQ will not be able to connect to Redis.');
} else {
  console.log(`[Queue] Initializing connection to ${connection.host}:${connection.port} (TLS: ${!!connection.tls})`);
}
