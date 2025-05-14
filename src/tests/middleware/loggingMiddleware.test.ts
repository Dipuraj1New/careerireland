/**
 * Logging middleware tests
 */
import { NextRequest, NextResponse } from 'next/server';
import { loggingMiddleware } from '@/middleware/loggingMiddleware';
import logger from '@/lib/logger';

// Mock logger
jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('Logging Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log incoming requests', async () => {
    // Create request
    const request = new NextRequest('http://localhost:3000/api/users', {
      method: 'GET',
      headers: {
        'user-agent': 'test-agent',
        'referer': 'http://localhost:3000',
      },
    });

    // Mock next function
    const next = jest.fn().mockResolvedValue(
      new NextResponse(null, { status: 200 })
    );

    // Call middleware
    await loggingMiddleware(request, next);

    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Incoming request: GET /api/users'),
      expect.objectContaining({
        method: 'GET',
        path: '/api/users',
        userAgent: 'test-agent',
        referer: 'http://localhost:3000',
      })
    );
  });

  it('should log successful responses', async () => {
    // Create request
    const request = new NextRequest('http://localhost:3000/api/users');

    // Mock next function
    const next = jest.fn().mockResolvedValue(
      new NextResponse(null, { status: 200 })
    );

    // Call middleware
    await loggingMiddleware(request, next);

    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Response: 200'),
      expect.objectContaining({
        status: 200,
        duration: expect.any(Number),
      })
    );
  });

  it('should log client error responses', async () => {
    // Create request
    const request = new NextRequest('http://localhost:3000/api/users');

    // Mock next function
    const next = jest.fn().mockResolvedValue(
      new NextResponse(null, { status: 404 })
    );

    // Call middleware
    await loggingMiddleware(request, next);

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Response: 404'),
      expect.objectContaining({
        status: 404,
        duration: expect.any(Number),
      })
    );
  });

  it('should log server error responses', async () => {
    // Create request
    const request = new NextRequest('http://localhost:3000/api/users');

    // Mock next function
    const next = jest.fn().mockResolvedValue(
      new NextResponse(null, { status: 500 })
    );

    // Call middleware
    await loggingMiddleware(request, next);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Response: 500'),
      expect.objectContaining({
        status: 500,
        duration: expect.any(Number),
      })
    );
  });

  it('should log errors that occur during request processing', async () => {
    // Create request
    const request = new NextRequest('http://localhost:3000/api/users');

    // Mock next function
    const error = new Error('Test error');
    const next = jest.fn().mockRejectedValue(error);

    // Call middleware
    const response = await loggingMiddleware(request, next);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      'Request processing error',
      expect.objectContaining({
        error: 'Test error',
        stack: expect.any(String),
      })
    );
    expect(response.status).toBe(500);
  });

  it('should skip logging for static assets', async () => {
    // Create request for static asset
    const request = new NextRequest('http://localhost:3000/_next/static/chunk.js');

    // Mock next function
    const next = jest.fn().mockResolvedValue(
      new NextResponse(null, { status: 200 })
    );

    // Call middleware
    await loggingMiddleware(request, next);

    // Assert
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('should add request ID header to response', async () => {
    // Create request
    const request = new NextRequest('http://localhost:3000/api/users');

    // Mock next function
    const next = jest.fn().mockResolvedValue(
      new NextResponse(null, { status: 200 })
    );

    // Call middleware
    const response = await loggingMiddleware(request, next);

    // Assert
    expect(response.headers.has('X-Request-ID')).toBe(true);
    expect(response.headers.get('X-Request-ID')).toMatch(/[a-z0-9]+/);
  });
});
