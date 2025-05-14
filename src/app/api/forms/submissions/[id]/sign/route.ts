import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import formSignatureService from '@/services/form/formSignatureService';
import formGenerationService from '@/services/form/formGenerationService';
import { getCaseById } from '@/services/case/caseService';
import { UserRole } from '@/types/user';
import { SignatureType } from '@/types/form';

/**
 * POST /api/forms/submissions/:id/sign
 * Sign a form
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
    
    // Parse request body
    const body = await req.json();
    const { signatureData, signatureType } = body;
    
    if (!signatureData) {
      return NextResponse.json(
        { error: 'Signature data is required' },
        { status: 400 }
      );
    }
    
    // Get IP address and user agent
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Sign form
    const result = await formSignatureService.signForm(
      params.id,
      signatureData,
      signatureType || SignatureType.DRAWN,
      session.user.id,
      ipAddress.toString(),
      userAgent
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      signature: result.signature,
    });
  } catch (error: any) {
    console.error('Error signing form:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sign form' },
      { status: 500 }
    );
  }
}
