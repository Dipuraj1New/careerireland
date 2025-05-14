import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/services/auth/authService';
import { UserRole } from '@/types/user';

/**
 * Authentication middleware
 */
export function withAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  allowedRoles?: UserRole[]
) {
  return async function (req: NextRequest, context: any) {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.get('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify token
      const decoded = verifyToken(token);
      
      // Check if user has required role
      if (allowedRoles && allowedRoles.length > 0) {
        if (!decoded.role || !allowedRoles.includes(decoded.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }
      
      // Add user to request
      context.user = decoded;
      
      // Call the original handler
      return handler(req, context);
    } catch (error) {
      console.error('Authentication error:', error);
      
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}
