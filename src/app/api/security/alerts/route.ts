import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { 
  createSecurityAlert,
  getSecurityAlertById,
  getSecurityAlertsByStatus,
  updateSecurityAlertStatus
} from '@/services/security/securityPolicyService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';
import { 
  SecurityAlertType, 
  SecurityAlertSeverity,
  SecurityAlertStatus
} from '@/types/security';

/**
 * GET /api/security/alerts
 * Get security alerts
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
    const status = url.searchParams.get('status') as SecurityAlertStatus | null;
    const type = url.searchParams.get('type') as SecurityAlertType | null;
    const severity = url.searchParams.get('severity') as SecurityAlertSeverity | null;
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Build query
    let query = `
      SELECT * FROM security_alerts
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (type) {
      query += ` AND alert_type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(severity);
    }
    
    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    // Execute query
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM security_alerts
      WHERE 1=1
    `;
    
    const countParams: any[] = [];
    let countParamIndex = 1;
    
    if (status) {
      countQuery += ` AND status = $${countParamIndex++}`;
      countParams.push(status);
    }
    
    if (type) {
      countQuery += ` AND alert_type = $${countParamIndex++}`;
      countParams.push(type);
    }
    
    if (severity) {
      countQuery += ` AND severity = $${countParamIndex++}`;
      countParams.push(severity);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Map results
    const alerts = result.rows.map(row => ({
      id: row.id,
      alertType: row.alert_type,
      severity: row.severity,
      source: row.source,
      description: row.description,
      details: row.details 
        ? (typeof row.details === 'string' 
          ? JSON.parse(row.details) 
          : row.details)
        : undefined,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      resolvedBy: row.resolved_by
    }));
    
    return NextResponse.json({
      alerts,
      pagination: {
        total,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Error getting security alerts:', error);
    return NextResponse.json(
      { error: 'Failed to get security alerts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/alerts
 * Create a new security alert
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate request
    if (!body.alertType || !body.severity || !body.source || !body.description) {
      return NextResponse.json(
        { error: 'Alert type, severity, source, and description are required' },
        { status: 400 }
      );
    }
    
    // Create the alert
    const alert = await createSecurityAlert(
      body.alertType,
      body.severity,
      body.source,
      body.description,
      body.details
    );
    
    // Log the action
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: session.user.id,
      action: AuditAction.CREATE,
      details: {
        action: 'create_security_alert',
        alertId: alert.id,
        alertType: alert.alertType,
        severity: alert.severity
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
      userAgent: req.headers.get('user-agent')
    });
    
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error creating security alert:', error);
    return NextResponse.json(
      { error: 'Failed to create security alert' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/security/alerts/[id]
 * Get a specific security alert
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
    
    const alertId = params.id;
    
    // Get the alert
    const alert = await getSecurityAlertById(alertId);
    
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error getting security alert:', error);
    return NextResponse.json(
      { error: 'Failed to get security alert' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/security/alerts/[id]
 * Update a security alert status
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
    
    const alertId = params.id;
    
    // Get the alert
    const alert = await getSecurityAlertById(alertId);
    
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate request
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    
    // Update the alert
    const updatedAlert = await updateSecurityAlertStatus(
      alertId,
      body.status,
      session.user.id
    );
    
    // Log the action
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: session.user.id,
      action: AuditAction.UPDATE,
      details: {
        action: 'update_security_alert',
        alertId,
        oldStatus: alert.status,
        newStatus: updatedAlert.status
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
      userAgent: req.headers.get('user-agent')
    });
    
    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error('Error updating security alert:', error);
    return NextResponse.json(
      { error: 'Failed to update security alert' },
      { status: 500 }
    );
  }
}
