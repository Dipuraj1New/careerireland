import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  runComplianceCheck,
  runAllComplianceChecks,
  getComplianceRequirementById
} from '@/services/compliance/complianceMonitoringService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';

/**
 * POST /api/compliance/check
 * 
 * Run compliance checks
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only admins can run compliance checks
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    
    // If requirementId is provided, run check for that requirement
    if (body.requirementId) {
      // Check if requirement exists
      const requirement = await getComplianceRequirementById(body.requirementId);
      if (!requirement) {
        return NextResponse.json(
          { error: 'Compliance requirement not found' },
          { status: 404 }
        );
      }
      
      // Run compliance check
      const result = await runComplianceCheck(
        body.requirementId,
        session.user.id
      );
      
      // Create audit log
      await createAuditLog({
        userId: session.user.id,
        entityType: AuditEntityType.COMPLIANCE_REQUIREMENT,
        entityId: body.requirementId,
        action: AuditAction.CHECK,
        details: {
          status: result.status,
          timestamp: result.timestamp
        }
      });
      
      return NextResponse.json(result);
    } else {
      // Run all compliance checks
      const results = await runAllComplianceChecks(session.user.id);
      
      // Create audit log
      await createAuditLog({
        userId: session.user.id,
        entityType: AuditEntityType.COMPLIANCE_REQUIREMENT,
        entityId: 'all',
        action: AuditAction.CHECK_ALL,
        details: {
          count: results.length,
          timestamp: new Date()
        }
      });
      
      return NextResponse.json({ results });
    }
  } catch (error) {
    console.error('Error running compliance checks:', error);
    return NextResponse.json(
      { error: 'Failed to run compliance checks' },
      { status: 500 }
    );
  }
}
