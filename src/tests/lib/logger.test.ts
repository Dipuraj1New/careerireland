/**
 * Logger utility tests
 */
import logger from '@/lib/logger';
import config from '@/lib/config';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;

// Mock config
jest.mock('@/lib/config', () => ({
  env: 'test',
  log: {
    level: 'debug',
    format: 'json',
  },
}));

describe('Logger Utility', () => {
  beforeEach(() => {
    // Mock console methods
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
    console.debug = originalConsoleDebug;
  });

  it('should log error messages', () => {
    // Call logger
    logger.error('Test error message');

    // Assert
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"level":"error"')
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Test error message"')
    );
  });

  it('should log warning messages', () => {
    // Call logger
    logger.warn('Test warning message');

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('"level":"warn"')
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Test warning message"')
    );
  });

  it('should log info messages', () => {
    // Call logger
    logger.info('Test info message');

    // Assert
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"level":"info"')
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Test info message"')
    );
  });

  it('should log debug messages', () => {
    // Call logger
    logger.debug('Test debug message');

    // Assert
    expect(console.debug).toHaveBeenCalledWith(
      expect.stringContaining('"level":"debug"')
    );
    expect(console.debug).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Test debug message"')
    );
  });

  it('should include context in log messages', () => {
    // Call logger with context
    logger.info('Test message with context', { user: 'test-user', action: 'login' });

    // Assert
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"context":{"user":"test-user","action":"login"}')
    );
  });

  it('should include environment in log messages', () => {
    // Call logger
    logger.info('Test message');

    // Assert
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"environment":"test"')
    );
  });

  it('should respect log level configuration', () => {
    // Mock config with lower log level
    (config.log.level as any) = 'info';

    // Call logger
    logger.debug('This should not be logged');

    // Assert
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('should format logs as pretty when configured', () => {
    // Mock config with pretty format
    (config.log.format as any) = 'pretty';

    // Call logger
    logger.info('Test pretty format');

    // Assert
    expect(console.info).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] INFO: Test pretty format/)
    );
  });
});
