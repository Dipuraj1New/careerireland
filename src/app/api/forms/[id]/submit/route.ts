/**
 * API route for submitting a form to a government portal
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import * as portalIntegrationService from '../../../../../services/portal/portalIntegrationService';
import * as formSubmissionRepository from '../../../../../repositories/formSubmissionRepository';
import * as caseRepository from '../../../../../repositories/caseRepository';
import { UserRole } from '../../../../../types/user';

/**
 * POST /api/forms/:id/submit
 * Submit a form to a government portal
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
    
    // Get form submission
    const formSubmission = await formSubmissionRepository.getFormSubmissionById(params.id);
    
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
    
    // Check if user has access to the case
    if (
      session.user.role === UserRole.APPLICANT && caseData.applicantId !== session.user.id ||
      session.user.role === UserRole.AGENT && caseData.agentId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Submit form to portal
    const result = await portalIntegrationService.submitFormToPortal(
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
    console.error('Error submitting form to portal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit form to portal' },
      { status: 500 }
    );
  }
}
