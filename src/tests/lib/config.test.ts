/**
 * Configuration utility tests
 */
import config from '@/lib/config';

describe('Configuration Utility', () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore environment variables
    process.env = originalEnv;
  });

  it('should load configuration with default values', () => {
    // Assert
    expect(config).toBeDefined();
    expect(config.env).toBe('test');
    expect(config.database).toBeDefined();
    expect(config.redis).toBeDefined();
    expect(config.supabase).toBeDefined();
    expect(config.auth).toBeDefined();
    expect(config.app).toBeDefined();
    expect(config.log).toBeDefined();
  });

  it('should use environment-specific database configuration', () => {
    // Assert
    expect(config.database.maxConnections).toBeDefined();
    
    // In test environment, we should have a specific configuration
    if (config.env === 'test') {
      expect(config.database.url).toBeDefined();
    }
  });

  it('should use environment-specific Redis configuration', () => {
    // Assert
    expect(config.redis.url).toBeDefined();
    expect(config.redis.maxRetriesPerRequest).toBeDefined();
    expect(config.redis.enableReadyCheck).toBeDefined();
  });

  it('should use environment-specific Supabase configuration', () => {
    // Assert
    expect(config.supabase.url).toBeDefined();
    expect(config.supabase.key).toBeDefined();
    expect(config.supabase.storageBucket).toBe('documents');
  });

  it('should use environment-specific authentication configuration', () => {
    // Assert
    expect(config.auth.jwtSecret).toBeDefined();
    expect(config.auth.jwtExpiresIn).toBeDefined();
    expect(config.auth.refreshTokenExpiresIn).toBeDefined();
    
    // In test environment, we should use a test secret
    if (config.env === 'test') {
      expect(config.auth.jwtSecret).toBe('test-secret');
    }
  });

  it('should use environment-specific application configuration', () => {
    // Assert
    expect(config.app.apiUrl).toBeDefined();
    expect(config.app.port).toBeDefined();
    expect(config.app.corsOrigins).toBeDefined();
    expect(config.app.rateLimitMax).toBeDefined();
    expect(config.app.rateLimitWindowMs).toBeDefined();
  });

  it('should use environment-specific logging configuration', () => {
    // Assert
    expect(config.log.level).toBeDefined();
    expect(config.log.format).toBeDefined();
  });

  it('should have different CORS origins based on environment', () => {
    // Development environment
    if (config.env === 'development') {
      expect(config.app.corsOrigins).toContain('http://localhost:3000');
    }
    
    // Staging environment
    if (config.env === 'staging') {
      expect(config.app.corsOrigins).toContain('https://staging.careerireland.com');
      expect(config.app.corsOrigins).toContain('https://staging-api.careerireland.com');
    }
    
    // Production environment
    if (config.env === 'production') {
      expect(config.app.corsOrigins).toContain('https://careerireland.com');
      expect(config.app.corsOrigins).toContain('https://api.careerireland.com');
    }
  });
});
