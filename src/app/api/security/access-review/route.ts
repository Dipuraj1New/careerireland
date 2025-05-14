import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  createAccessReview,
  getAccessReviews,
  updateAccessReviewStatus
} from '@/services/security/accessReviewService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';
import { AccessReviewStatus } from '@/types/security';

/**
 * GET /api/security/access-review
 * 
 * Get access reviews with filtering
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only admins can access access reviews
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') as AccessReviewStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get access reviews
    const result = await getAccessReviews(status, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting access reviews:', error);
    return NextResponse.json(
      { error: 'Failed to get access reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/access-review
 * 
 * Create a new access review
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only admins can create access reviews
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.userIds || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, userIds, startDate, endDate' },
        { status: 400 }
      );
    }
    
    // Validate userIds is an array
    if (!Array.isArray(body.userIds) || body.userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds must be a non-empty array' },
        { status: 400 }
      );
    }
    
    // Create access review
    const review = await createAccessReview(
      body.name,
      body.userIds,
      new Date(body.startDate),
      new Date(body.endDate),
      body.description,
      session.user.id
    );
    
    return NextResponse.json(review);
  } catch (error) {
    console.error('Error creating access review:', error);
    return NextResponse.json(
      { error: 'Failed to create access review' },
      { status: 500 }
    );
  }
}
