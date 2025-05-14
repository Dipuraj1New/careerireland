/**
 * Access Review Service
 * 
 * This service implements access review functionality to periodically review
 * user access rights and permissions.
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { sendNotification } from '@/services/notification/notificationService';
import { NotificationType } from '@/types/notification';
import { 
  AccessReview, 
  AccessReviewItem, 
  AccessReviewStatus, 
  AccessReviewItemStatus, 
  AccessReviewDecision 
} from '@/types/security';
import { UserRole } from '@/types/user';

/**
 * Create a new access review
 */
export async function createAccessReview(
  name: string,
  userIds: string[],
  startDate: Date,
  endDate: Date,
  description?: string,
  createdBy?: string
): Promise<AccessReview> {
  // Start a transaction
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    // Create the access review
    const reviewResult = await client.query(
      `INSERT INTO access_reviews (
        id, name, description, status, start_date, end_date, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        uuidv4(),
        name,
        description || null,
        AccessReviewStatus.PENDING,
        startDate,
        endDate,
        createdBy || null,
        new Date(),
        new Date()
      ]
    );
    
    const review = mapAccessReviewFromDb(reviewResult.rows[0]);
    
    // Create access review items for each user
    for (const userId of userIds) {
      await client.query(
        `INSERT INTO access_review_items (
          id, review_id, user_id, status, created_at
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          uuidv4(),
          review.id,
          userId,
          AccessReviewItemStatus.PENDING,
          new Date()
        ]
      );
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Create audit log
    if (createdBy) {
      await createAuditLog({
        userId: createdBy,
        entityType: AuditEntityType.ACCESS_REVIEW,
        entityId: review.id,
        action: AuditAction.CREATE,
        details: { name, userCount: userIds.length }
      });
    }
    
    // Send notifications to reviewers (typically admins or security officers)
    await notifyReviewers(review.id, name, startDate, endDate);
    
    return review;
  } catch (error) {
    // Rollback the transaction on error
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

/**
 * Get access review by ID
 */
export async function getAccessReviewById(id: string): Promise<AccessReview | null> {
  const result = await db.query(
    `SELECT * FROM access_reviews WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAccessReviewFromDb(result.rows[0]);
}

/**
 * Get access reviews with filtering
 */
export async function getAccessReviews(
  status?: AccessReviewStatus,
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: AccessReview[], pagination: { total: number, page: number, limit: number } }> {
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM access_reviews`;
  const params: any[] = [];
  
  if (status) {
    query += ` WHERE status = $1`;
    params.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await db.query(query, params);
  
  // Get total count for pagination
  let countQuery = `SELECT COUNT(*) FROM access_reviews`;
  if (status) {
    countQuery += ` WHERE status = $1`;
  }
  
  const countResult = await db.query(countQuery, status ? [status] : []);
  const total = parseInt(countResult.rows[0].count);
  
  return {
    reviews: result.rows.map(mapAccessReviewFromDb),
    pagination: {
      total,
      page,
      limit
    }
  };
}

/**
 * Get access review items for a review
 */
export async function getAccessReviewItems(
  reviewId: string,
  status?: AccessReviewItemStatus
): Promise<AccessReviewItem[]> {
  let query = `
    SELECT ari.*, u.email, u.first_name, u.last_name, u.role
    FROM access_review_items ari
    JOIN users u ON ari.user_id = u.id
    WHERE ari.review_id = $1
  `;
  const params: any[] = [reviewId];
  
  if (status) {
    query += ` AND ari.status = $2`;
    params.push(status);
  }
  
  query += ` ORDER BY ari.created_at ASC`;
  
  const result = await db.query(query, params);
  
  return result.rows.map(mapAccessReviewItemFromDb);
}

/**
 * Update access review status
 */
export async function updateAccessReviewStatus(
  id: string,
  status: AccessReviewStatus,
  updatedBy: string
): Promise<AccessReview | null> {
  const result = await db.query(
    `UPDATE access_reviews
     SET status = $1, updated_at = $2
     WHERE id = $3
     RETURNING *`,
    [status, new Date(), id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Create audit log
  await createAuditLog({
    userId: updatedBy,
    entityType: AuditEntityType.ACCESS_REVIEW,
    entityId: id,
    action: AuditAction.UPDATE_STATUS,
    details: { status }
  });
  
  return mapAccessReviewFromDb(result.rows[0]);
}

/**
 * Review an access review item
 */
export async function reviewAccessReviewItem(
  itemId: string,
  reviewerId: string,
  decision: AccessReviewDecision,
  notes?: string
): Promise<AccessReviewItem | null> {
  const result = await db.query(
    `UPDATE access_review_items
     SET reviewer_id = $1, status = $2, decision = $3, notes = $4, reviewed_at = $5
     WHERE id = $6
     RETURNING *`,
    [
      reviewerId,
      AccessReviewItemStatus.COMPLETED,
      decision,
      notes || null,
      new Date(),
      itemId
    ]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const item = mapAccessReviewItemFromDb(result.rows[0]);
  
  // Create audit log
  await createAuditLog({
    userId: reviewerId,
    entityType: AuditEntityType.ACCESS_REVIEW_ITEM,
    entityId: itemId,
    action: AuditAction.UPDATE,
    details: { decision, notes }
  });
  
  // If decision is to revoke or modify access, take appropriate action
  if (decision === AccessReviewDecision.REVOKE) {
    await handleRevokeAccess(item.userId);
  } else if (decision === AccessReviewDecision.MODIFY) {
    // This would typically trigger a workflow for access modification
    // For now, we'll just log it
    console.log(`Access modification required for user ${item.userId}`);
  }
  
  // Check if all items in the review are completed
  await checkReviewCompletion(item.reviewId);
  
  return item;
}

/**
 * Check if all items in a review are completed and update review status if needed
 */
async function checkReviewCompletion(reviewId: string): Promise<void> {
  const itemsResult = await db.query(
    `SELECT COUNT(*) as total, 
            SUM(CASE WHEN status = $1 THEN 1 ELSE 0 END) as completed
     FROM access_review_items
     WHERE review_id = $2`,
    [AccessReviewItemStatus.COMPLETED, reviewId]
  );
  
  const { total, completed } = itemsResult.rows[0];
  
  if (parseInt(total) > 0 && parseInt(total) === parseInt(completed)) {
    // All items are completed, update review status
    await db.query(
      `UPDATE access_reviews
       SET status = $1, updated_at = $2
       WHERE id = $3`,
      [AccessReviewStatus.COMPLETED, new Date(), reviewId]
    );
  } else if (parseInt(completed) > 0) {
    // Some items are completed, update review status to in progress
    await db.query(
      `UPDATE access_reviews
       SET status = $1, updated_at = $2
       WHERE id = $3 AND status = $4`,
      [AccessReviewStatus.IN_PROGRESS, new Date(), reviewId, AccessReviewStatus.PENDING]
    );
  }
}

/**
 * Handle revoking access for a user
 */
async function handleRevokeAccess(userId: string): Promise<void> {
  // This would implement the actual access revocation logic
  // For example, removing permission groups, changing role, etc.
  
  // For now, we'll just log it
  console.log(`Access revoked for user ${userId}`);
  
  // Notify the user
  await sendNotification({
    userId,
    type: NotificationType.SECURITY,
    title: 'Access Changes',
    message: 'Your access permissions have been updated as part of a security review.',
    priority: 'high'
  });
}

/**
 * Notify reviewers about a new access review
 */
async function notifyReviewers(
  reviewId: string,
  reviewName: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  // Get users with admin role or security officer role
  const adminResult = await db.query(
    `SELECT id FROM users WHERE role = $1`,
    [UserRole.ADMIN]
  );
  
  for (const admin of adminResult.rows) {
    await sendNotification({
      userId: admin.id,
      type: NotificationType.SECURITY,
      title: 'New Access Review',
      message: `A new access review "${reviewName}" has been created and requires your attention.`,
      priority: 'medium',
      data: {
        reviewId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  }
}

/**
 * Map database access review to AccessReview type
 */
function mapAccessReviewFromDb(dbReview: any): AccessReview {
  return {
    id: dbReview.id,
    name: dbReview.name,
    description: dbReview.description,
    status: dbReview.status,
    startDate: new Date(dbReview.start_date),
    endDate: new Date(dbReview.end_date),
    createdBy: dbReview.created_by,
    createdAt: new Date(dbReview.created_at),
    updatedAt: new Date(dbReview.updated_at),
  };
}

/**
 * Map database access review item to AccessReviewItem type
 */
function mapAccessReviewItemFromDb(dbItem: any): AccessReviewItem {
  return {
    id: dbItem.id,
    reviewId: dbItem.review_id,
    userId: dbItem.user_id,
    reviewerId: dbItem.reviewer_id,
    status: dbItem.status,
    decision: dbItem.decision,
    notes: dbItem.notes,
    reviewedAt: dbItem.reviewed_at ? new Date(dbItem.reviewed_at) : undefined,
    createdAt: new Date(dbItem.created_at),
    // Include user details if available
    userEmail: dbItem.email,
    userName: dbItem.first_name && dbItem.last_name 
      ? `${dbItem.first_name} ${dbItem.last_name}`
      : undefined,
    userRole: dbItem.role,
  };
}
