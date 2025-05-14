import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  createDataSubjectRequest, 
  processRightToBeForgottenRequest 
} from '@/services/security/dataProtectionService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';
import { DataSubjectRequestType, DataSubjectRequestStatus } from '@/types/security';

/**
 * POST /api/users/[id]/forget
 * Create a right to be forgotten request
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = params.id;
    
    // Check if the user is requesting for themselves or is an admin
    if (session.user.id !== userId && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Create the data subject request
    const request = await createDataSubjectRequest(
      DataSubjectRequestType.ERASURE,
      {
        reason: body.reason || 'User requested data deletion',
        additionalInfo: body.additionalInfo
      },
      userId,
      session.user.id,
      body.notes
    );
    
    // Log the action
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: userId,
      action: AuditAction.CREATE,
      details: {
        action: 'create_forget_request',
        requestId: request.id
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
      userAgent: req.headers.get('user-agent')
    });
    
    return NextResponse.json({
      id: request.id,
      status: request.status,
      requestedAt: request.requestedAt
    });
  } catch (error) {
    console.error('Error creating forget request:', error);
    return NextResponse.json(
      { error: 'Failed to create forget request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/[id]/forget
 * Get right to be forgotten requests for a user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = params.id;
    
    // Check if the user is requesting for themselves or is an admin
    if (session.user.id !== userId && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get the data subject requests
    const result = await db.query(
      `SELECT * FROM data_subject_requests
       WHERE user_id = $1 AND request_type = $2
       ORDER BY requested_at DESC`,
      [userId, DataSubjectRequestType.ERASURE]
    );
    
    const requests = result.rows.map(row => ({
      id: row.id,
      status: row.status,
      requestedAt: new Date(row.requested_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null
    }));
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error getting forget requests:', error);
    return NextResponse.json(
      { error: 'Failed to get forget requests' },
      { status: 500 }
    );
  }
}
