import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import formGenerationService from '@/services/form/formGenerationService';
import { getCaseById } from '@/services/case/caseService';
import { UserRole } from '@/types/user';

/**
 * POST /api/forms/submissions/:id/submit
 * Submit a form
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
    
    // Get submission
    const submission = await formGenerationService.getFormSubmissionById(params.id);
    
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to the case
    const caseData = await getCaseById(submission.caseId);
    
    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to the case
    if (
      session.user.role === UserRole.APPLICANT && caseData.applicantId !== session.user.id ||
      session.user.role === UserRole.AGENT && caseData.agentId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Submit form
    const result = await formGenerationService.submitForm(
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
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit form' },
      { status: 500 }
    );
  }
}
