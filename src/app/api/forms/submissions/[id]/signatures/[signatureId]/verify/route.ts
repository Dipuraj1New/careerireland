import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { verifySignature } from '@/services/form/formSignatureService';
import { getFormSubmissionById } from '@/services/form/formGenerationService';
import { getCaseById } from '@/services/case/caseService';
import { UserRole } from '@/types/user';

/**
 * POST /api/forms/submissions/:id/signatures/:signatureId/verify
 * Verify a signature on a form submission
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; signatureId: string } }
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
    const submission = await getFormSubmissionById(params.id);
    
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
    
    // Verify signature
    const result = await verifySignature(
      params.id,
      params.signatureId,
      session.user.id
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      verified: result.verified,
      message: result.message,
      details: result.details,
    });
  } catch (error: any) {
    console.error('Error verifying signature:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify signature' },
      { status: 500 }
    );
  }
}
