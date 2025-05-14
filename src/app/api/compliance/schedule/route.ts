import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  scheduleComplianceCheck,
  getScheduledComplianceChecks,
  updateScheduledComplianceCheck,
  deleteScheduledComplianceCheck,
  ComplianceCheckFrequency
} from '@/services/compliance/complianceScheduleService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';

/**
 * GET /api/compliance/schedule
 * 
 * Get scheduled compliance checks
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - requirementId: Filter by requirement ID (optional)
 * 
 * Returns:
 * - 200: List of scheduled compliance checks with pagination
 * - 401: Unauthorized
 * - 403: Forbidden
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check authorization (admin only)
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const requirementId = searchParams.get('requirementId') || undefined;
    
    // Get scheduled compliance checks
    const result = await getScheduledComplianceChecks(page, limit, requirementId);
    
    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.COMPLIANCE_SCHEDULE,
      entityId: 'all',
      action: AuditAction.VIEW,
      details: { page, limit, requirementId }
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error getting scheduled compliance checks:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduled compliance checks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/compliance/schedule
 * 
 * Schedule a new compliance check
 * 
 * Request body:
 * - requirementIds: Array of requirement IDs to schedule
 * - frequency: Frequency of the check (daily, weekly, monthly, quarterly)
 * - startDate: Date to start the schedule (optional, defaults to now)
 * - notifyEmail: Email to notify when check is complete
 * 
 * Returns:
 * - 200: Created schedule
 * - 400: Bad request (missing required fields)
 * - 401: Unauthorized
 * - 403: Forbidden
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check authorization (admin only)
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.requirementIds || !Array.isArray(body.requirementIds) || body.requirementIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: requirementIds (must be a non-empty array)' },
        { status: 400 }
      );
    }
    
    if (!body.frequency) {
      return NextResponse.json(
        { error: 'Missing required field: frequency' },
        { status: 400 }
      );
    }
    
    if (!body.notifyEmail) {
      return NextResponse.json(
        { error: 'Missing required field: notifyEmail' },
        { status: 400 }
      );
    }
    
    // Validate frequency is valid
    if (!Object.values(ComplianceCheckFrequency).includes(body.frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency' },
        { status: 400 }
      );
    }
    
    // Schedule compliance checks
    const schedules = [];
    for (const requirementId of body.requirementIds) {
      const schedule = await scheduleComplianceCheck(
        requirementId,
        body.frequency,
        session.user.id,
        body.notifyEmail,
        body.startDate ? new Date(body.startDate) : undefined
      );
      schedules.push(schedule);
    }
    
    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.COMPLIANCE_SCHEDULE,
      entityId: 'multiple',
      action: AuditAction.CREATE,
      details: { 
        requirementIds: body.requirementIds,
        frequency: body.frequency,
        notifyEmail: body.notifyEmail
      }
    });
    
    return NextResponse.json({ schedules });
  } catch (error: any) {
    console.error('Error scheduling compliance check:', error);
    return NextResponse.json(
      { error: 'Failed to schedule compliance check' },
      { status: 500 }
    );
  }
}
