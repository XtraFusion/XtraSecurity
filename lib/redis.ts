import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

declare global {
  var _redisGlobal: Redis | undefined;
}

let redisClient: Redis | null = null;

if (redisUrl) {
  if (!global._redisGlobal) {
    const options: any = {
      enableOfflineQueue: false,
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
    };

    if (redisUrl.startsWith('rediss://')) {
      options.tls = {
        rejectUnauthorized: false // Common for cloud/managed redis
      };
    }

    global._redisGlobal = new Redis(redisUrl, options);
    
    global._redisGlobal.on('error', (err) => {
        console.error('[Redis] Connection Error:', err.message);
    });

    global._redisGlobal.on('connect', () => {
        console.log('[Redis] Connected successfully');
    });
  }
  redisClient = global._redisGlobal;
}

export const redis = redisClient;
