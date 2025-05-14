import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  checkAccess,
  ResourceType,
  ActionType
} from '@/services/security/attributeBasedAccessService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';

/**
 * POST /api/security/access-control/check
 * 
 * Check if a user has access to a resource
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.resourceType || !body.resourceId || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: resourceType, resourceId, action' },
        { status: 400 }
      );
    }
    
    // Check if resource type is valid
    if (!Object.values(ResourceType).includes(body.resourceType)) {
      return NextResponse.json(
        { error: 'Invalid resource type' },
        { status: 400 }
      );
    }
    
    // Check if action is valid
    if (!Object.values(ActionType).includes(body.action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
    
    // Check access
    const userId = body.userId || session.user.id;
    
    // Only admins can check access for other users
    if (userId !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions to check access for other users' },
        { status: 403 }
      );
    }
    
    const result = await checkAccess(
      userId,
      body.resourceType,
      body.resourceId,
      body.action
    );
    
    // Create audit log for access check
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: userId,
      action: AuditAction.ACCESS_CHECK,
      details: {
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        action: body.action,
        result: result.allowed
      }
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking access:', error);
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    );
  }
}
