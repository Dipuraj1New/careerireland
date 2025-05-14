import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  getAccessReviewById,
  getAccessReviewItems,
  reviewAccessReviewItem
} from '@/services/security/accessReviewService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';
import { AccessReviewItemStatus, AccessReviewDecision } from '@/types/security';

/**
 * GET /api/security/access-review/[id]/items
 * 
 * Get items for an access review
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only admins can access access review items
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') as AccessReviewItemStatus | null;

    // Check if access review exists
    const review = await getAccessReviewById(params.id);
    if (!review) {
      return NextResponse.json({ error: 'Access review not found' }, { status: 404 });
    }

    // Get access review items
    const items = await getAccessReviewItems(params.id, status);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error getting access review items:', error);
    return NextResponse.json(
      { error: 'Failed to get access review items' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/access-review/[id]/items/[itemId]
 * 
 * Review an access review item
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string, itemId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only admins can review access review items
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.decision) {
      return NextResponse.json(
        { error: 'Missing required field: decision' },
        { status: 400 }
      );
    }
    
    // Validate decision is valid
    if (!Object.values(AccessReviewDecision).includes(body.decision)) {
      return NextResponse.json(
        { error: 'Invalid decision' },
        { status: 400 }
      );
    }
    
    // Review access review item
    const item = await reviewAccessReviewItem(
      params.itemId,
      session.user.id,
      body.decision,
      body.notes
    );
    
    if (!item) {
      return NextResponse.json({ error: 'Access review item not found' }, { status: 404 });
    }
    
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error reviewing access review item:', error);
    return NextResponse.json(
      { error: 'Failed to review access review item' },
      { status: 500 }
    );
  }
}
