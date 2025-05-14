import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getCaseById } from '@/services/case/caseRepository';
import { getAuditLogsByEntity } from '@/services/audit/auditService';
import { UserRole } from '@/types/user';
import { AuditEntityType } from '@/types/audit';

/**
 * GET /api/cases/:id/history
 * Get case history (audit logs)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const caseId = params.id;
    
    // Get case
    const caseData = await getCaseById(caseId);
    
    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to the case
    // Applicants can only access their own cases
    // Agents can access cases assigned to them
    // Admins can access all cases
    if (
      user.role === UserRole.APPLICANT && caseData.applicantId !== user.id ||
      user.role === UserRole.AGENT && caseData.agentId !== user.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get audit logs for the case
    const auditLogs = await getAuditLogsByEntity(AuditEntityType.CASE, caseId);
    
    return NextResponse.json(
      { history: auditLogs },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting case history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
