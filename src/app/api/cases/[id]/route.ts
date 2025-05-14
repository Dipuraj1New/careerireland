import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import {
  getCaseWithDocuments,
  updateCaseStatus,
  assignCaseToAgent,
  updateCasePriority
} from '@/services/case/caseService';
import { UserRole } from '@/types/user';
import { CaseStatus, CasePriority } from '@/types/case';

/**
 * GET /api/cases/:id
 * Get case by ID with documents
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

    // Get case with documents
    const caseData = await getCaseWithDocuments(caseId);

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

    return NextResponse.json(
      { case: caseData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting case:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cases/:id
 * Update case
 */
export async function PATCH(
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
    const caseData = await getCaseWithDocuments(caseId);

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Check if user has access to update the case
    // Applicants can only update their own cases
    // Agents can update cases assigned to them
    // Admins can update all cases
    if (
      user.role === UserRole.APPLICANT && caseData.applicantId !== user.id ||
      user.role === UserRole.AGENT && caseData.agentId !== user.id && user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();

    let updatedCase = null;

    // Update case status if provided
    if (body.status) {
      // Validate status
      if (!Object.values(CaseStatus).includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }

      try {
        updatedCase = await updateCaseStatus(
          caseId,
          body.status,
          user.id,
          user.role,
          body.notes
        );
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to update case status' },
          { status: 400 }
        );
      }
    }

    // Update case agent if provided
    if (body.agentId !== undefined) {
      // Only admins can assign agents
      if (user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Only admins can assign agents' },
          { status: 403 }
        );
      }

      updatedCase = await assignCaseToAgent(caseId, body.agentId, user.id);
    }

    // Update case priority if provided
    if (body.priority) {
      // Validate priority
      if (!Object.values(CasePriority).includes(body.priority)) {
        return NextResponse.json(
          { error: 'Invalid priority' },
          { status: 400 }
        );
      }

      // Only agents and admins can update priority
      if (user.role === UserRole.APPLICANT) {
        return NextResponse.json(
          { error: 'Only agents and admins can update priority' },
          { status: 403 }
        );
      }

      updatedCase = await updateCasePriority(caseId, body.priority, user.id);
    }

    if (!updatedCase) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { case: updatedCase },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating case:', error);

    // Handle specific errors
    if (error instanceof Error && error.message.includes('Invalid status transition')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
