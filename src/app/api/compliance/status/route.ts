import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  createComplianceRequirement,
  getComplianceRequirements,
  getComplianceRequirementById,
  updateComplianceRequirementStatus,
  runComplianceCheck,
  runAllComplianceChecks,
  ComplianceRequirementType,
  ComplianceStatus
} from '@/services/compliance/complianceMonitoringService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';

/**
 * GET /api/compliance/status
 * 
 * Get compliance requirements with filtering
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only admins can access compliance status
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') as ComplianceRequirementType | null;
    const status = searchParams.get('status') as ComplianceStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get compliance requirements
    const result = await getComplianceRequirements(type, status, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting compliance requirements:', error);
    return NextResponse.json(
      { error: 'Failed to get compliance requirements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/compliance/status
 * 
 * Create a new compliance requirement
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only admins can create compliance requirements
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.description || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, type' },
        { status: 400 }
      );
    }
    
    // Validate type is valid
    if (!Object.values(ComplianceRequirementType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }
    
    // Create compliance requirement
    const requirement = await createComplianceRequirement(
      body.name,
      body.description,
      body.type,
      body.details,
      session.user.id
    );
    
    return NextResponse.json(requirement);
  } catch (error) {
    console.error('Error creating compliance requirement:', error);
    return NextResponse.json(
      { error: 'Failed to create compliance requirement' },
      { status: 500 }
    );
  }
}
