import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { 
  createNewCase, 
  getApplicantCases, 
  getAgentCases 
} from '@/services/case/caseService';
import { UserRole } from '@/types/user';
import { CaseCreateData, VisaType, CasePriority } from '@/types/case';

/**
 * GET /api/cases
 * Get cases for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get cases based on user role
    let cases;
    if (user.role === UserRole.APPLICANT) {
      cases = await getApplicantCases(user.id);
    } else if (user.role === UserRole.AGENT || user.role === UserRole.ADMIN) {
      // For agents and admins, get cases assigned to them
      cases = await getAgentCases(user.id);
    } else {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { cases },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting cases:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases
 * Create a new case
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only applicants can create cases
    if (user.role !== UserRole.APPLICANT) {
      return NextResponse.json(
        { error: 'Only applicants can create cases' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.visaType) {
      return NextResponse.json(
        { error: 'Visa type is required' },
        { status: 400 }
      );
    }
    
    // Validate visa type
    if (!Object.values(VisaType).includes(body.visaType)) {
      return NextResponse.json(
        { error: 'Invalid visa type' },
        { status: 400 }
      );
    }
    
    // Validate priority if provided
    if (body.priority && !Object.values(CasePriority).includes(body.priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      );
    }
    
    // Create case data
    const caseData: CaseCreateData = {
      applicantId: user.id,
      visaType: body.visaType,
      priority: body.priority,
      notes: body.notes,
    };
    
    // Create case
    const newCase = await createNewCase(caseData, user.id);
    
    return NextResponse.json(
      { case: newCase },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
