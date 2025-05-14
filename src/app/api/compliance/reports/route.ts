import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  generateComplianceReport,
  getComplianceReports,
  getComplianceReportById,
  sendComplianceReportByEmail,
  scheduleComplianceReport,
  ReportType,
  ReportFormat
} from '@/services/compliance/complianceReportingService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';

/**
 * GET /api/compliance/reports
 * 
 * Get compliance reports with filtering
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only admins can access compliance reports
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') as ReportType | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get compliance reports
    const result = await getComplianceReports(type, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting compliance reports:', error);
    return NextResponse.json(
      { error: 'Failed to get compliance reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/compliance/reports
 * 
 * Generate a new compliance report
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only admins can generate compliance reports
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.type || !body.format) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, format' },
        { status: 400 }
      );
    }
    
    // Validate type is valid
    if (!Object.values(ReportType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }
    
    // Validate format is valid
    if (!Object.values(ReportFormat).includes(body.format)) {
      return NextResponse.json(
        { error: 'Invalid format' },
        { status: 400 }
      );
    }
    
    // Generate compliance report
    const report = await generateComplianceReport(
      body.name,
      body.type,
      body.format,
      session.user.id,
      body.parameters,
      body.description
    );
    
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating compliance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}
