/**
 * Redis connection tests
 */
import { connectRedis, checkRedisConnection, closeRedis } from '@/lib/redis';
import config from '@/lib/config';

describe('Redis Connection', () => {
  // Close Redis connection after all tests
  afterAll(async () => {
    await closeRedis();
  });

  test('should connect to Redis successfully', async () => {
    // Check connection
    const connected = await checkRedisConnection();
    
    // Assert
    expect(connected).toBe(true);
  });

  test('should be able to set and get values', async () => {
    // Connect to Redis
    const redis = await connectRedis();
    
    // Set a value
    await redis.set('test-key', 'test-value');
    
    // Get the value
    const value = await redis.get('test-key');
    
    // Assert
    expect(value).toBe('test-value');
    
    // Clean up
    await redis.del('test-key');
  });

  test('should use the correct Redis configuration', () => {
    // Assert that we're using the test Redis in test environment
    expect(config.env).toBe('test');
    expect(config.redis.url).toBeDefined();
  });
});
