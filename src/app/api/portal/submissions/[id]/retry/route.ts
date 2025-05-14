/**
 * API route for retrying a failed portal submission
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import * as portalIntegrationService from '../../../../../../services/portal/portalIntegrationService';
import * as portalRepository from '../../../../../../repositories/portalRepository';
import * as formSubmissionRepository from '../../../../../../repositories/formSubmissionRepository';
import * as caseRepository from '../../../../../../repositories/caseRepository';
import { UserRole } from '../../../../../../types/user';
import { PortalSubmissionStatus } from '../../../../../../types/portal';

/**
 * POST /api/portal/submissions/:id/retry
 * Retry a failed portal submission
 */
export async function POST(
  request: NextRequest,
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
    
    // Only agents and admins can retry submissions
    if (session.user.role !== UserRole.AGENT && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get portal submission
    const portalSubmission = await portalRepository.getPortalSubmissionById(params.id);
    
    if (!portalSubmission) {
      return NextResponse.json(
        { error: 'Portal submission not found' },
        { status: 404 }
      );
    }
    
    // Check if submission can be retried
    if (
      portalSubmission.status !== PortalSubmissionStatus.FAILED &&
      portalSubmission.status !== PortalSubmissionStatus.RETRYING
    ) {
      return NextResponse.json(
        { error: `Cannot retry submission with status ${portalSubmission.status}` },
        { status: 400 }
      );
    }
    
    // Get form submission
    const formSubmission = await formSubmissionRepository.getFormSubmissionById(
      portalSubmission.formSubmissionId
    );
    
    if (!formSubmission) {
      return NextResponse.json(
        { error: 'Form submission not found' },
        { status: 404 }
      );
    }
    
    // Get case
    const caseData = await caseRepository.getCaseById(formSubmission.caseId);
    
    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }
    
    // Check if agent has access to the case
    if (
      session.user.role === UserRole.AGENT &&
      caseData.agentId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Retry portal submission
    const result = await portalIntegrationService.retryPortalSubmission(
      params.id,
      session.user.id
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      submission: result.submission,
    });
  } catch (error: any) {
    console.error('Error retrying portal submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retry portal submission' },
      { status: 500 }
    );
  }
}
