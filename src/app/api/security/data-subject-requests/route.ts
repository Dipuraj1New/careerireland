import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { 
  getDataSubjectRequestById,
  updateDataSubjectRequest,
  processRightToBeForgottenRequest
} from '@/services/security/dataProtectionService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';
import { 
  DataSubjectRequestType, 
  DataSubjectRequestStatus 
} from '@/types/security';

/**
 * GET /api/security/data-subject-requests
 * Get all data subject requests
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Build query
    let query = `
      SELECT dsr.*, u.email, u.first_name, u.last_name
      FROM data_subject_requests dsr
      LEFT JOIN users u ON dsr.user_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND dsr.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (type) {
      query += ` AND dsr.request_type = $${paramIndex++}`;
      params.push(type);
    }
    
    // Add ordering and pagination
    query += ` ORDER BY dsr.requested_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    // Execute query
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM data_subject_requests
      WHERE 1=1
    `;
    
    const countParams: any[] = [];
    let countParamIndex = 1;
    
    if (status) {
      countQuery += ` AND status = $${countParamIndex++}`;
      countParams.push(status);
    }
    
    if (type) {
      countQuery += ` AND request_type = $${countParamIndex++}`;
      countParams.push(type);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Map results
    const requests = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.email,
      userName: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : null,
      requestType: row.request_type,
      status: row.status,
      requestedAt: new Date(row.requested_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      handledBy: row.handled_by
    }));
    
    return NextResponse.json({
      requests,
      pagination: {
        total,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Error getting data subject requests:', error);
    return NextResponse.json(
      { error: 'Failed to get data subject requests' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/security/data-subject-requests/[id]
 * Get a specific data subject request
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
    
    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const requestId = params.id;
    
    // Get the request
    const request = await getDataSubjectRequestById(requestId);
    
    if (!request) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }
    
    // Get user details if userId exists
    let user = null;
    if (request.userId) {
      const userResult = await db.query(
        `SELECT id, email, first_name, last_name
         FROM users
         WHERE id = $1`,
        [request.userId]
      );
      
      if (userResult.rows.length > 0) {
        user = {
          id: userResult.rows[0].id,
          email: userResult.rows[0].email,
          firstName: userResult.rows[0].first_name,
          lastName: userResult.rows[0].last_name
        };
      }
    }
    
    return NextResponse.json({
      ...request,
      user
    });
  } catch (error) {
    console.error('Error getting data subject request:', error);
    return NextResponse.json(
      { error: 'Failed to get data subject request' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/security/data-subject-requests/[id]
 * Update a data subject request
 */
export async function PUT(
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
    
    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const requestId = params.id;
    
    // Get the request
    const request = await getDataSubjectRequestById(requestId);
    
    if (!request) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Update the request
    const updatedRequest = await updateDataSubjectRequest(
      requestId,
      body.status,
      body.responseData,
      body.notes,
      session.user.id
    );
    
    // If this is a right to be forgotten request and it's being approved, process it
    if (
      request.requestType === DataSubjectRequestType.ERASURE &&
      body.status === DataSubjectRequestStatus.COMPLETED &&
      request.status !== DataSubjectRequestStatus.COMPLETED
    ) {
      await processRightToBeForgottenRequest(requestId, session.user.id);
    }
    
    // Log the action
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: request.userId || 'unknown',
      action: AuditAction.UPDATE,
      details: {
        action: 'update_data_subject_request',
        requestId,
        oldStatus: request.status,
        newStatus: updatedRequest.status
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
      userAgent: req.headers.get('user-agent')
    });
    
    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating data subject request:', error);
    return NextResponse.json(
      { error: 'Failed to update data subject request' },
      { status: 500 }
    );
  }
}
