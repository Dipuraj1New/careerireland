/**
 * Application configuration utility
 * Loads environment-specific settings and provides a centralized configuration interface
 */

// Environment types
export type Environment = 'development' | 'staging' | 'production' | 'test';

// Database configuration
interface DatabaseConfig {
  url: string;
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

// Redis configuration
interface RedisConfig {
  url: string;
  maxRetriesPerRequest: number | null;
  enableReadyCheck: boolean;
}

// Supabase configuration
interface SupabaseConfig {
  url: string;
  key: string;
  storageBucket: string;
}

// Authentication configuration
interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  passwordResetExpiresIn: string;
}

// Application configuration
interface AppConfig {
  apiUrl: string;
  port: number;
  corsOrigins: string[];
  rateLimitMax: number;
  rateLimitWindowMs: number;
}

// Logging configuration
interface LogConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'pretty';
}

// Email configuration
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// SMS configuration
interface SmsConfig {
  provider: 'twilio' | 'aws-sns' | 'nexmo';
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

// AI configuration
interface AIConfig {
  // OCR configuration
  ocrProvider: 'tesseract' | 'google-vision';

  // Google Vision API configuration
  googleVision?: {
    keyFilename?: string; // Path to service account key file
    credentials?: string; // JSON string of service account credentials
  };

  // OpenAI configuration
  openai?: {
    apiKey: string;
    model: string;
  };
}

// Selenium configuration for government portal automation
interface SeleniumConfig {
  // WebDriver configuration
  driverType: 'chrome' | 'firefox' | 'edge';
  headless: boolean;
  timeout: number; // in milliseconds

  // Portal credentials (stored securely)
  portalCredentialsSecretName: string;

  // Retry configuration
  maxRetries: number;
  retryDelay: number; // in milliseconds
}

// Complete configuration interface
export interface Config {
  env: Environment;
  database: DatabaseConfig;
  redis: RedisConfig;
  supabase: SupabaseConfig;
  auth: AuthConfig;
  app: AppConfig;
  log: LogConfig;
  email: EmailConfig;
  sms: SmsConfig;
  ai: AIConfig;
  selenium: SeleniumConfig;
}

// Get current environment
const getEnvironment = (): Environment => {
  const env = process.env.NODE_ENV || 'development';
  if (['development', 'staging', 'production', 'test'].includes(env)) {
    return env as Environment;
  }
  return 'development';
};

// Load configuration based on environment
const loadConfig = (): Config => {
  const env = getEnvironment();

  // Default configuration
  const config: Config = {
    env,
    database: {
      url: process.env.DATABASE_URL || '',
      maxConnections: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    redis: {
      url: process.env.REDIS_URL || '',
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    },
    supabase: {
      url: process.env.SUPABASE_URL || '',
      key: process.env.SUPABASE_KEY || '',
      storageBucket: 'documents',
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET || 'development-secret',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
      refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      passwordResetExpiresIn: '1h',
    },
    app: {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
      port: parseInt(process.env.PORT || '3000', 10),
      corsOrigins: ['http://localhost:3000'],
      rateLimitMax: 100,
      rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    },
    log: {
      level: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
      format: env === 'development' ? 'pretty' : 'json',
    },
    email: {
      host: process.env.EMAIL_HOST || '',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
      },
      from: process.env.EMAIL_FROM || 'noreply@careerireland.com',
    },
    sms: {
      provider: (process.env.SMS_PROVIDER as 'twilio' | 'aws-sns' | 'nexmo') || 'twilio',
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      fromNumber: process.env.TWILIO_FROM_NUMBER || '',
    },
    ai: {
      ocrProvider: (process.env.OCR_PROVIDER as 'tesseract' | 'google-vision') || 'tesseract',
      googleVision: {
        keyFilename: process.env.GOOGLE_VISION_KEY_FILENAME,
        credentials: process.env.GOOGLE_VISION_CREDENTIALS,
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      },
    },
    selenium: {
      driverType: (process.env.SELENIUM_DRIVER_TYPE as 'chrome' | 'firefox' | 'edge') || 'chrome',
      headless: process.env.SELENIUM_HEADLESS === 'true',
      timeout: parseInt(process.env.SELENIUM_TIMEOUT || '30000', 10),
      portalCredentialsSecretName: process.env.PORTAL_CREDENTIALS_SECRET_NAME || 'portal-credentials',
      maxRetries: parseInt(process.env.SELENIUM_MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.SELENIUM_RETRY_DELAY || '5000', 10),
    },
  };

  // Environment-specific overrides
  switch (env) {
    case 'development':
      config.app.corsOrigins = ['http://localhost:3000'];
      config.database.maxConnections = 5;
      break;
    case 'staging':
      config.app.corsOrigins = ['https://staging.careerireland.com', 'https://staging-api.careerireland.com'];
      config.database.maxConnections = 10;
      break;
    case 'production':
      config.app.corsOrigins = ['https://careerireland.com', 'https://api.careerireland.com'];
      config.database.maxConnections = 20;
      break;
    case 'test':
      config.database.url = process.env.TEST_DATABASE_URL || config.database.url;
      config.redis.url = process.env.TEST_REDIS_URL || config.redis.url;
      config.auth.jwtSecret = 'test-secret';
      break;
  }

  return config;
};

// Export configuration
const config = loadConfig();
export default config;
