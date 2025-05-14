import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { scheduleNotification } from '@/services/notification/notificationDeliveryService';
import { NotificationType } from '@/types/notification';
import { getComplianceRequirementById, runComplianceCheck } from './complianceMonitoringService';

/**
 * Compliance check frequency enum
 */
export enum ComplianceCheckFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

/**
 * Scheduled compliance check interface
 */
export interface ScheduledComplianceCheck {
  id: string;
  requirementId: string;
  requirementName?: string;
  frequency: ComplianceCheckFrequency;
  nextRunDate: Date;
  lastRunDate: Date | null;
  notifyEmail: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * Map database row to ScheduledComplianceCheck
 */
function mapScheduledCheckFromDb(row: any): ScheduledComplianceCheck {
  return {
    id: row.id,
    requirementId: row.requirement_id,
    requirementName: row.requirement_name,
    frequency: row.frequency as ComplianceCheckFrequency,
    nextRunDate: row.next_run_date,
    lastRunDate: row.last_run_date,
    notifyEmail: row.notify_email,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isActive: row.is_active
  };
}

/**
 * Calculate next run date based on frequency
 */
function calculateNextRunDate(frequency: ComplianceCheckFrequency, startDate: Date = new Date()): Date {
  const nextRunDate = new Date(startDate);
  
  switch (frequency) {
    case ComplianceCheckFrequency.DAILY:
      nextRunDate.setDate(nextRunDate.getDate() + 1);
      break;
    case ComplianceCheckFrequency.WEEKLY:
      nextRunDate.setDate(nextRunDate.getDate() + 7);
      break;
    case ComplianceCheckFrequency.MONTHLY:
      nextRunDate.setMonth(nextRunDate.getMonth() + 1);
      break;
    case ComplianceCheckFrequency.QUARTERLY:
      nextRunDate.setMonth(nextRunDate.getMonth() + 3);
      break;
  }
  
  return nextRunDate;
}

/**
 * Schedule a compliance check
 */
export async function scheduleComplianceCheck(
  requirementId: string,
  frequency: ComplianceCheckFrequency,
  createdBy: string,
  notifyEmail: string,
  startDate: Date = new Date()
): Promise<ScheduledComplianceCheck> {
  // Verify requirement exists
  const requirement = await getComplianceRequirementById(requirementId);
  if (!requirement) {
    throw new Error(`Compliance requirement with ID ${requirementId} not found`);
  }
  
  const id = uuidv4();
  const now = new Date();
  const nextRunDate = calculateNextRunDate(frequency, startDate);
  
  // Insert into database
  const result = await db.query(
    `INSERT INTO compliance_check_schedules (
      id, requirement_id, frequency, next_run_date, notify_email,
      created_by, created_at, updated_at, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      id,
      requirementId,
      frequency,
      nextRunDate,
      notifyEmail,
      createdBy,
      now,
      now,
      true
    ]
  );
  
  const schedule = mapScheduledCheckFromDb(result.rows[0]);
  
  // Create audit log
  await createAuditLog({
    userId: createdBy,
    entityType: AuditEntityType.COMPLIANCE_SCHEDULE,
    entityId: id,
    action: AuditAction.CREATE,
    details: {
      requirementId,
      frequency,
      nextRunDate,
      notifyEmail
    }
  });
  
  return {
    ...schedule,
    requirementName: requirement.name
  };
}

/**
 * Get scheduled compliance checks with pagination
 */
export async function getScheduledComplianceChecks(
  page: number = 1,
  limit: number = 10,
  requirementId?: string
): Promise<{
  schedules: ScheduledComplianceCheck[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}> {
  // Validate pagination parameters
  if (page < 1) page = 1;
  if (limit < 1) limit = 10;
  if (limit > 100) limit = 100;
  
  const offset = (page - 1) * limit;
  
  // Build query
  let query = `
    SELECT s.*, r.name as requirement_name
    FROM compliance_check_schedules s
    LEFT JOIN compliance_requirements r ON s.requirement_id = r.id
  `;
  
  let countQuery = `
    SELECT COUNT(*) FROM compliance_check_schedules
  `;
  
  const queryParams = [];
  
  // Add filters
  if (requirementId) {
    query += ` WHERE s.requirement_id = $1`;
    countQuery += ` WHERE requirement_id = $1`;
    queryParams.push(requirementId);
  }
  
  // Add sorting and pagination
  query += ` ORDER BY s.next_run_date ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
  queryParams.push(limit, offset);
  
  // Execute queries
  const [result, countResult] = await Promise.all([
    db.query(query, queryParams),
    db.query(countQuery, requirementId ? [requirementId] : [])
  ]);
  
  const total = parseInt(countResult.rows[0].count);
  
  return {
    schedules: result.rows.map(mapScheduledCheckFromDb),
    pagination: {
      total,
      page,
      limit
    }
  };
}

/**
 * Update a scheduled compliance check
 */
export async function updateScheduledComplianceCheck(
  id: string,
  updates: {
    frequency?: ComplianceCheckFrequency;
    nextRunDate?: Date;
    notifyEmail?: string;
    isActive?: boolean;
  },
  updatedBy: string
): Promise<ScheduledComplianceCheck | null> {
  const now = new Date();
  
  // Build update query
  const updateFields = [];
  const queryParams = [id];
  let paramIndex = 2;
  
  if (updates.frequency) {
    updateFields.push(`frequency = $${paramIndex++}`);
    queryParams.push(updates.frequency);
  }
  
  if (updates.nextRunDate) {
    updateFields.push(`next_run_date = $${paramIndex++}`);
    queryParams.push(updates.nextRunDate);
  }
  
  if (updates.notifyEmail !== undefined) {
    updateFields.push(`notify_email = $${paramIndex++}`);
    queryParams.push(updates.notifyEmail);
  }
  
  if (updates.isActive !== undefined) {
    updateFields.push(`is_active = $${paramIndex++}`);
    queryParams.push(updates.isActive);
  }
  
  // Always update the updated_at timestamp
  updateFields.push(`updated_at = $${paramIndex++}`);
  queryParams.push(now);
  
  if (updateFields.length === 1) {
    // Only updated_at is being updated, nothing to do
    return null;
  }
  
  const query = `
    UPDATE compliance_check_schedules
    SET ${updateFields.join(', ')}
    WHERE id = $1
    RETURNING *
  `;
  
  const result = await db.query(query, queryParams);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const schedule = mapScheduledCheckFromDb(result.rows[0]);
  
  // Create audit log
  await createAuditLog({
    userId: updatedBy,
    entityType: AuditEntityType.COMPLIANCE_SCHEDULE,
    entityId: id,
    action: AuditAction.UPDATE,
    details: updates
  });
  
  return schedule;
}

/**
 * Delete a scheduled compliance check
 */
export async function deleteScheduledComplianceCheck(
  id: string,
  deletedBy: string
): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM compliance_check_schedules WHERE id = $1 RETURNING id`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return false;
  }
  
  // Create audit log
  await createAuditLog({
    userId: deletedBy,
    entityType: AuditEntityType.COMPLIANCE_SCHEDULE,
    entityId: id,
    action: AuditAction.DELETE,
    details: { timestamp: new Date() }
  });
  
  return true;
}
