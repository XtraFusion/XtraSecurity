import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

declare global {
  var _redisGlobal: Redis | undefined;
  var _redisPubGlobal: Redis | undefined;
  var _redisSubGlobal: Redis | undefined;
}

let redisClient: Redis | null = null;
let redisPubClient: Redis | null = null;
let redisSubClient: Redis | null = null;

if (redisUrl) {
  const getOptions = () => {
    const options: any = {
      enableOfflineQueue: false,
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
    };
    if (redisUrl.startsWith('rediss://')) {
      options.tls = {
        rejectUnauthorized: false
      };
    }
    return options;
  };

  if (!global._redisGlobal) {
    global._redisGlobal = new Redis(redisUrl, getOptions());
    global._redisGlobal.on('error', (err) => {
      console.error('[Redis Client] Error:', err.message);
    });
  }

  if (!global._redisPubGlobal) {
    global._redisPubGlobal = new Redis(redisUrl, getOptions());
    global._redisPubGlobal.on('error', (err) => {
      console.error('[Redis Pub] Error:', err.message);
    });
  }

  if (!global._redisSubGlobal) {
    global._redisSubGlobal = new Redis(redisUrl, getOptions());
    global._redisSubGlobal.on('error', (err) => {
      console.error('[Redis Sub] Error:', err.message);
    });
  }

  redisClient = global._redisGlobal;
  redisPubClient = global._redisPubGlobal;
  redisSubClient = global._redisSubGlobal;
}

export const redis = redisClient;
export const redisPub = redisPubClient;
export const redisSub = redisSubClient;
