import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { 
  getAuditLogs,
  getAuditLogById,
  getAuditLogsByEntity,
  getAuditLogsByUser,
  getAuditLogsByAction
} from '@/services/audit/auditService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';

/**
 * GET /api/security/audit-logs
 * 
 * Fetch audit logs with filtering options
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only admins and security officers can access audit logs
    if (
      !session.user.roles.includes(UserRole.ADMIN) && 
      !session.user.roles.includes(UserRole.SECURITY_OFFICER)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const entityType = url.searchParams.get('entityType') as AuditEntityType | null;
    const entityId = url.searchParams.get('entityId');
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action') as AuditAction | null;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: 'Invalid page parameter' }, { status: 400 });
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
    }

    // Build query conditions
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (entityType) {
      conditions.push(`entity_type = $${paramIndex}`);
      params.push(entityType);
      paramIndex++;
    }

    if (entityId) {
      conditions.push(`entity_id = $${paramIndex}`);
      params.push(entityId);
      paramIndex++;
    }

    if (userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (action) {
      conditions.push(`action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(new Date(startDate));
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(new Date(endDate));
      paramIndex++;
    }

    // Build the query
    let query = 'SELECT * FROM audit_logs';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Add ordering
    query += ' ORDER BY timestamp DESC';
    
    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit);
    params.push((page - 1) * limit);

    // Count total records for pagination
    let countQuery = 'SELECT COUNT(*) FROM audit_logs';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Execute the queries
    const [results, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, params.length - 2)) // Remove pagination params
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Map the results
    const auditLogs = results.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      timestamp: row.timestamp
    }));

    // Log the audit log access
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: session.user.id,
      action: AuditAction.VIEW,
      details: {
        filters: {
          entityType,
          entityId,
          userId,
          action,
          startDate,
          endDate,
          page,
          limit
        }
      }
    });

    return NextResponse.json({
      data: auditLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/security/audit-logs/:id
 * 
 * Fetch a specific audit log by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only admins and security officers can access audit logs
    if (
      !session.user.roles.includes(UserRole.ADMIN) && 
      !session.user.roles.includes(UserRole.SECURITY_OFFICER)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const auditLog = await getAuditLogById(params.id);
    
    if (!auditLog) {
      return NextResponse.json({ error: 'Audit log not found' }, { status: 404 });
    }

    return NextResponse.json({ data: auditLog });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}
