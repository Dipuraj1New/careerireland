import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  getComplianceReportById,
  sendComplianceReportByEmail
} from '@/services/compliance/complianceReportingService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';

/**
 * POST /api/compliance/reports/[id]/send
 * 
 * Send a compliance report by email
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only admins can send compliance reports
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if report exists
    const report = await getComplianceReportById(params.id);
    if (!report) {
      return NextResponse.json({ error: 'Compliance report not found' }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.recipients || !Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: recipients (must be a non-empty array)' },
        { status: 400 }
      );
    }
    
    // Send report by email
    const result = await sendComplianceReportByEmail(
      params.id,
      body.recipients,
      body.subject,
      body.message
    );
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to send report' },
        { status: 500 }
      );
    }
    
    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.COMPLIANCE_REPORT,
      entityId: params.id,
      action: AuditAction.SEND,
      details: {
        recipients: body.recipients,
        timestamp: new Date()
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending compliance report:', error);
    return NextResponse.json(
      { error: 'Failed to send compliance report' },
      { status: 500 }
    );
  }
}
