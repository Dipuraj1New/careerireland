/**
 * API endpoint for submitting a case
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getCaseById, submitCase } from '@/services/case/caseService';
import { UserRole } from '@/types/user';
import { CaseStatus } from '@/types/case';

/**
 * POST /api/cases/:id/submit
 * Submit a case
 */
export async function POST(
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
    if (user.role === UserRole.APPLICANT && caseData.applicantId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Check if case is in draft status
    if (caseData.status !== CaseStatus.DRAFT) {
      return NextResponse.json(
        { error: 'Only draft cases can be submitted' },
        { status: 400 }
      );
    }
    
    // Parse request body for notes
    const body = await req.json();
    const notes = body.notes || 'Case submitted by applicant';
    
    try {
      // Submit case
      const updatedCase = await submitCase(caseId, user.id, user.role);
      
      if (!updatedCase) {
        return NextResponse.json(
          { error: 'Failed to submit case' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { case: updatedCase },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to submit case' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error submitting case:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
