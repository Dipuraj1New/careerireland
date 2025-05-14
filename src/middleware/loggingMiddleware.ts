/**
 * Logging middleware
 * Logs incoming requests and responses
 */
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

/**
 * Generate a unique request ID
 * @returns Unique request ID
 */
const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Log request details
 * @param req Next.js request
 * @param requestId Unique request ID
 */
const logRequest = (req: NextRequest, requestId: string): void => {
  const url = new URL(req.url);
  
  logger.info(`Incoming request: ${req.method} ${url.pathname}`, {
    requestId,
    method: req.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    userAgent: req.headers.get('user-agent'),
    referer: req.headers.get('referer'),
    ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
  });
};

/**
 * Log response details
 * @param res Next.js response
 * @param requestId Unique request ID
 * @param startTime Request start time
 */
const logResponse = (res: NextResponse, requestId: string, startTime: number): void => {
  const duration = Date.now() - startTime;
  const status = res.status;
  
  if (status >= 500) {
    logger.error(`Response: ${status}`, { requestId, status, duration });
  } else if (status >= 400) {
    logger.warn(`Response: ${status}`, { requestId, status, duration });
  } else {
    logger.info(`Response: ${status}`, { requestId, status, duration });
  }
};

/**
 * Logging middleware function
 * @param req Next.js request
 * @param next Next middleware function
 * @returns Next.js response
 */
export async function loggingMiddleware(
  req: NextRequest,
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip logging for static assets
  if (req.nextUrl.pathname.startsWith('/_next/') || 
      req.nextUrl.pathname.startsWith('/static/') ||
      req.nextUrl.pathname.endsWith('.ico')) {
    return next();
  }
  
  // Generate request ID and start time
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Log request
  logRequest(req, requestId);
  
  try {
    // Process request
    const response = await next();
    
    // Clone response to add headers
    const responseWithHeaders = NextResponse.next({
      request: {
        headers: new Headers(req.headers),
      },
    });
    
    // Add request ID header
    responseWithHeaders.headers.set('X-Request-ID', requestId);
    
    // Log response
    logResponse(response, requestId, startTime);
    
    return responseWithHeaders;
  } catch (error) {
    // Log error
    logger.error('Request processing error', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return error response
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
