/**
 * Health check API endpoint
 * Used for monitoring the application health
 */
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkRedisConnection } from '@/lib/redis';
import { checkSupabaseConnection } from '@/lib/supabase';
import config from '@/lib/config';

export async function GET() {
  try {
    // Check database connection
    const dbConnected = await db.checkConnection();
    
    // Check Redis connection
    const redisConnected = await checkRedisConnection();
    
    // Check Supabase connection
    const supabaseConnected = await checkSupabaseConnection();
    
    // Get application version from package.json
    const appVersion = process.env.npm_package_version || 'unknown';
    
    // Prepare response
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.env,
      version: appVersion,
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
        redis: redisConnected ? 'connected' : 'disconnected',
        supabase: supabaseConnected ? 'connected' : 'disconnected',
      },
    };
    
    // If any service is disconnected, return 503 Service Unavailable
    if (!dbConnected || !redisConnected || !supabaseConnected) {
      healthStatus.status = 'degraded';
      return NextResponse.json(healthStatus, { status: 503 });
    }
    
    return NextResponse.json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }, { status: 500 });
  }
}
