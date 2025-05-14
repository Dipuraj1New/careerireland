import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { 
  PermissionGroup, 
  UserPermissionGroup,
  AccessReview,
  AccessReviewItem,
  AccessReviewStatus,
  AccessReviewItemStatus,
  AccessReviewDecision
} from '@/types/security';
import { UserRole } from '@/types/user';

/**
 * Create a new permission group
 */
export async function createPermissionGroup(
  name: string,
  permissions: string[],
  description?: string
): Promise<PermissionGroup> {
  const result = await db.query(
    `INSERT INTO permission_groups (
      id, name, description, permissions, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      uuidv4(),
      name,
      description || null,
      JSON.stringify(permissions),
      new Date(),
      new Date()
    ]
  );
  
  return mapPermissionGroupFromDb(result.rows[0]);
}

/**
 * Get permission group by ID
 */
export async function getPermissionGroupById(id: string): Promise<PermissionGroup | null> {
  const result = await db.query(
    `SELECT * FROM permission_groups
     WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapPermissionGroupFromDb(result.rows[0]);
}

/**
 * Get permission group by name
 */
export async function getPermissionGroupByName(name: string): Promise<PermissionGroup | null> {
  const result = await db.query(
    `SELECT * FROM permission_groups
     WHERE name = $1`,
    [name]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapPermissionGroupFromDb(result.rows[0]);
}

/**
 * Update permission group
 */
export async function updatePermissionGroup(
  id: string,
  name?: string,
  permissions?: string[],
  description?: string
): Promise<PermissionGroup> {
  const updates = [];
  const values = [id];
  let paramIndex = 2;
  
  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  
  if (permissions !== undefined) {
    updates.push(`permissions = $${paramIndex++}`);
    values.push(JSON.stringify(permissions));
  }
  
  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  
  updates.push(`updated_at = $${paramIndex++}`);
  values.push(new Date());
  
  const result = await db.query(
    `UPDATE permission_groups
     SET ${updates.join(', ')}
     WHERE id = $1
     RETURNING *`,
    values
  );
  
  return mapPermissionGroupFromDb(result.rows[0]);
}

/**
 * Delete permission group
 */
export async function deletePermissionGroup(id: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM permission_groups
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  
  return result.rows.length > 0;
}

/**
 * Assign permission group to user
 */
export async function assignPermissionGroupToUser(
  userId: string,
  groupId: string,
  assignedBy?: string
): Promise<UserPermissionGroup> {
  const result = await db.query(
    `INSERT INTO user_permission_groups (
      user_id, group_id, assigned_at, assigned_by
    ) VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, group_id) DO UPDATE
    SET assigned_at = $3, assigned_by = $4
    RETURNING *`,
    [
      userId,
      groupId,
      new Date(),
      assignedBy || null
    ]
  );
  
  return mapUserPermissionGroupFromDb(result.rows[0]);
}

/**
 * Remove permission group from user
 */
export async function removePermissionGroupFromUser(
  userId: string,
  groupId: string
): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM user_permission_groups
     WHERE user_id = $1 AND group_id = $2
     RETURNING user_id`,
    [userId, groupId]
  );
  
  return result.rows.length > 0;
}

/**
 * Get permission groups for user
 */
export async function getPermissionGroupsForUser(userId: string): Promise<PermissionGroup[]> {
  const result = await db.query(
    `SELECT pg.*
     FROM permission_groups pg
     JOIN user_permission_groups upg ON pg.id = upg.group_id
     WHERE upg.user_id = $1`,
    [userId]
  );
  
  return result.rows.map(mapPermissionGroupFromDb);
}

/**
 * Get permissions for user
 */
export async function getPermissionsForUser(userId: string): Promise<string[]> {
  // Get user role
  const userResult = await db.query(
    `SELECT role FROM users WHERE id = $1`,
    [userId]
  );
  
  if (userResult.rows.length === 0) {
    return [];
  }
  
  const userRole = userResult.rows[0].role;
  
  // Get role-based permissions
  const rolePermissions = getRolePermissions(userRole);
  
  // Get permission groups for user
  const groups = await getPermissionGroupsForUser(userId);
  
  // Combine all permissions
  const groupPermissions = groups.flatMap(group => group.permissions);
  
  // Remove duplicates
  return [...new Set([...rolePermissions, ...groupPermissions])];
}

/**
 * Check if user has permission
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const permissions = await getPermissionsForUser(userId);
  return permissions.includes(permission);
}

/**
 * Create access review
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
    
    await client.query('COMMIT');
    return review;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating access review:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get access review by ID
 */
export async function getAccessReviewById(id: string): Promise<AccessReview | null> {
  const result = await db.query(
    `SELECT * FROM access_reviews
     WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAccessReviewFromDb(result.rows[0]);
}

/**
 * Get access review items for review
 */
export async function getAccessReviewItems(reviewId: string): Promise<AccessReviewItem[]> {
  const result = await db.query(
    `SELECT * FROM access_review_items
     WHERE review_id = $1`,
    [reviewId]
  );
  
  return result.rows.map(mapAccessReviewItemFromDb);
}

/**
 * Update access review item
 */
export async function updateAccessReviewItem(
  id: string,
  status: AccessReviewItemStatus,
  decision: AccessReviewDecision,
  reviewerId: string,
  notes?: string
): Promise<AccessReviewItem> {
  const result = await db.query(
    `UPDATE access_review_items
     SET status = $1,
         decision = $2,
         reviewer_id = $3,
         notes = $4,
         reviewed_at = $5
     WHERE id = $6
     RETURNING *`,
    [
      status,
      decision,
      reviewerId,
      notes || null,
      new Date(),
      id
    ]
  );
  
  return mapAccessReviewItemFromDb(result.rows[0]);
}

/**
 * Complete access review
 */
export async function completeAccessReview(id: string): Promise<AccessReview> {
  // Check if all items are reviewed
  const items = await getAccessReviewItems(id);
  const allReviewed = items.every(item => item.status !== AccessReviewItemStatus.PENDING);
  
  if (!allReviewed) {
    throw new Error('Cannot complete access review: not all items have been reviewed');
  }
  
  // Update access review status
  const result = await db.query(
    `UPDATE access_reviews
     SET status = $1,
         updated_at = $2
     WHERE id = $3
     RETURNING *`,
    [
      AccessReviewStatus.COMPLETED,
      new Date(),
      id
    ]
  );
  
  return mapAccessReviewFromDb(result.rows[0]);
}

/**
 * Get role-based permissions
 */
function getRolePermissions(role: string): string[] {
  switch (role) {
    case UserRole.ADMIN:
      return [
        'user:read', 'user:write', 'user:delete',
        'case:read', 'case:write', 'case:delete',
        'document:read', 'document:write', 'document:delete',
        'form:read', 'form:write', 'form:delete',
        'security:read', 'security:write',
        'analytics:read', 'analytics:write'
      ];
    case UserRole.AGENT:
      return [
        'user:read',
        'case:read', 'case:write',
        'document:read', 'document:write',
        'form:read', 'form:write'
      ];
    case UserRole.EXPERT:
      return [
        'user:read',
        'case:read',
        'document:read',
        'form:read'
      ];
    case UserRole.APPLICANT:
      return [
        'user:read:self',
        'case:read:self', 'case:write:self',
        'document:read:self', 'document:write:self',
        'form:read:self', 'form:write:self'
      ];
    default:
      return [];
  }
}

/**
 * Map database permission group to PermissionGroup type
 */
function mapPermissionGroupFromDb(dbGroup: any): PermissionGroup {
  return {
    id: dbGroup.id,
    name: dbGroup.name,
    description: dbGroup.description,
    permissions: typeof dbGroup.permissions === 'string' 
      ? JSON.parse(dbGroup.permissions) 
      : dbGroup.permissions,
    createdAt: new Date(dbGroup.created_at),
    updatedAt: new Date(dbGroup.updated_at),
  };
}

/**
 * Map database user permission group to UserPermissionGroup type
 */
function mapUserPermissionGroupFromDb(dbUserGroup: any): UserPermissionGroup {
  return {
    userId: dbUserGroup.user_id,
    groupId: dbUserGroup.group_id,
    assignedAt: new Date(dbUserGroup.assigned_at),
    assignedBy: dbUserGroup.assigned_by,
  };
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
  };
}
