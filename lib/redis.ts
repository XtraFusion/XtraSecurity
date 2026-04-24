import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

declare global {
  var _redisGlobal: Redis | undefined;
}

let redisClient: Redis | null = null;

if (redisUrl) {
  if (!global._redisGlobal) {
    global._redisGlobal = new Redis(redisUrl, {
      enableOfflineQueue: false,
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
    });
    
    global._redisGlobal.on('error', (err) => {
        // Suppress generic network errors without spamming standard output
    });
  }
  redisClient = global._redisGlobal;
}

export const redis = redisClient;
