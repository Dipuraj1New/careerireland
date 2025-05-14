import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import formGenerationService from '@/services/form/formGenerationService';
import { getCaseById } from '@/services/case/caseService';
import { UserRole } from '@/types/user';

/**
 * GET /api/forms/submissions
 * Get form submissions for a case
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
    
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const caseId = searchParams.get('caseId');
    
    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has access to the case
    const caseData = await getCaseById(caseId);
    
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
    
    // Get submissions
    const submissions = await formGenerationService.getFormSubmissionsByCaseId(caseId);
    
    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error('Error getting form submissions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get form submissions' },
      { status: 500 }
    );
  }
}
