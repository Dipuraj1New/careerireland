/**
 * Health check API endpoint tests
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';
import db from '@/lib/db';
import { checkRedisConnection } from '@/lib/redis';
import { checkSupabaseConnection } from '@/lib/supabase';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  checkConnection: jest.fn(),
}));

jest.mock('@/lib/redis', () => ({
  checkRedisConnection: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  checkSupabaseConnection: jest.fn(),
}));

describe('Health Check API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 OK when all services are connected', async () => {
    // Mock successful connections
    (db.checkConnection as jest.Mock).mockResolvedValue(true);
    (checkRedisConnection as jest.Mock).mockResolvedValue(true);
    (checkSupabaseConnection as jest.Mock).mockResolvedValue(true);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/health');

    // Call the handler
    const response = await GET();

    // Parse response
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual(
      expect.objectContaining({
        status: 'ok',
        timestamp: expect.any(String),
        services: {
          database: 'connected',
          redis: 'connected',
          supabase: 'connected',
        },
      })
    );
  });

  it('should return 503 Service Unavailable when database is disconnected', async () => {
    // Mock connections
    (db.checkConnection as jest.Mock).mockResolvedValue(false);
    (checkRedisConnection as jest.Mock).mockResolvedValue(true);
    (checkSupabaseConnection as jest.Mock).mockResolvedValue(true);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/health');

    // Call the handler
    const response = await GET();

    // Parse response
    const data = await response.json();

    // Assert
    expect(response.status).toBe(503);
    expect(data).toEqual(
      expect.objectContaining({
        status: 'degraded',
        services: {
          database: 'disconnected',
          redis: 'connected',
          supabase: 'connected',
        },
      })
    );
  });

  it('should return 503 Service Unavailable when Redis is disconnected', async () => {
    // Mock connections
    (db.checkConnection as jest.Mock).mockResolvedValue(true);
    (checkRedisConnection as jest.Mock).mockResolvedValue(false);
    (checkSupabaseConnection as jest.Mock).mockResolvedValue(true);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/health');

    // Call the handler
    const response = await GET();

    // Parse response
    const data = await response.json();

    // Assert
    expect(response.status).toBe(503);
    expect(data).toEqual(
      expect.objectContaining({
        status: 'degraded',
        services: {
          database: 'connected',
          redis: 'disconnected',
          supabase: 'connected',
        },
      })
    );
  });

  it('should return 503 Service Unavailable when Supabase is disconnected', async () => {
    // Mock connections
    (db.checkConnection as jest.Mock).mockResolvedValue(true);
    (checkRedisConnection as jest.Mock).mockResolvedValue(true);
    (checkSupabaseConnection as jest.Mock).mockResolvedValue(false);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/health');

    // Call the handler
    const response = await GET();

    // Parse response
    const data = await response.json();

    // Assert
    expect(response.status).toBe(503);
    expect(data).toEqual(
      expect.objectContaining({
        status: 'degraded',
        services: {
          database: 'connected',
          redis: 'connected',
          supabase: 'disconnected',
        },
      })
    );
  });

  it('should return 500 Internal Server Error when an exception occurs', async () => {
    // Mock error
    (db.checkConnection as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Create request
    const request = new NextRequest('http://localhost:3000/api/health');

    // Call the handler
    const response = await GET();

    // Parse response
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual(
      expect.objectContaining({
        status: 'error',
        timestamp: expect.any(String),
        error: 'Health check failed',
      })
    );
  });
});
