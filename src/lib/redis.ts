import { createClient, RedisClientType } from 'redis';
import config from './config';

// Create Redis client
const redisClient = createClient({
  url: config.redis.url,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
  },
  ...((config.redis.maxRetriesPerRequest !== null) && {
    maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
  }),
  disableOfflineQueue: true,
  enableReadyCheck: config.redis.enableReadyCheck,
});

// Handle Redis connection events
redisClient.on('connect', () => {
  if (config.env !== 'test') {
    console.log(`Connected to Redis in ${config.env} environment`);
  }
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

/**
 * Connect to Redis
 * @returns Connected Redis client
 */
const connectRedis = async (): Promise<RedisClientType> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
};

/**
 * Check Redis connection
 * @returns True if connected, false otherwise
 */
const checkRedisConnection = async (): Promise<boolean> => {
  try {
    const client = await connectRedis();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis connection check failed:', error);
    return false;
  }
};

/**
 * Close Redis connection
 */
const closeRedis = async (): Promise<void> => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
};

export { redisClient, connectRedis, checkRedisConnection, closeRedis };
