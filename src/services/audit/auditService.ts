import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { AuditLog, AuditLogCreateData, AuditEntityType, AuditAction } from '@/types/audit';

/**
 * Interface for audit log filtering options
 */
export interface AuditLogFilter {
  entityType?: AuditEntityType;
  entityId?: string;
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Create a new audit log entry
 */
export async function createAuditLog(logData: AuditLogCreateData): Promise<AuditLog> {
  const logId = uuidv4();
  const timestamp = new Date();

  const result = await db.query(
    `INSERT INTO audit_logs (
      id, user_id, entity_type, entity_id, action, details, ip_address, user_agent, timestamp
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      logId,
      logData.userId,
      logData.entityType,
      logData.entityId,
      logData.action,
      JSON.stringify(logData.details || {}),
      logData.ipAddress || null,
      logData.userAgent || null,
      timestamp,
    ]
  );

  return mapAuditLogFromDb(result.rows[0]);
}

/**
 * Get audit logs by entity
 */
export async function getAuditLogsByEntity(
  entityType: AuditEntityType,
  entityId: string
): Promise<AuditLog[]> {
  const result = await db.query(
    `SELECT * FROM audit_logs
     WHERE entity_type = $1 AND entity_id = $2
     ORDER BY timestamp DESC`,
    [entityType, entityId]
  );

  return result.rows.map(mapAuditLogFromDb);
}

/**
 * Get audit logs by user
 */
export async function getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
  const result = await db.query(
    `SELECT * FROM audit_logs
     WHERE user_id = $1
     ORDER BY timestamp DESC`,
    [userId]
  );

  return result.rows.map(mapAuditLogFromDb);
}

/**
 * Get audit logs by action
 */
export async function getAuditLogsByAction(action: AuditAction): Promise<AuditLog[]> {
  const result = await db.query(
    `SELECT * FROM audit_logs
     WHERE action = $1
     ORDER BY timestamp DESC`,
    [action]
  );

  return result.rows.map(mapAuditLogFromDb);
}

/**
 * Get audit log by ID
 */
export async function getAuditLogById(id: string): Promise<AuditLog | null> {
  const result = await db.query(
    `SELECT * FROM audit_logs WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapAuditLogFromDb(result.rows[0]);
}

/**
 * Get all audit logs with filtering and pagination
 */
export async function getAuditLogs(filter: AuditLogFilter = {}): Promise<{
  logs: AuditLog[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  // Default pagination values
  const page = filter.page || 1;
  const limit = filter.limit || 50;

  // Build query conditions
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (filter.entityType) {
    conditions.push(`entity_type = $${paramIndex}`);
    params.push(filter.entityType);
    paramIndex++;
  }

  if (filter.entityId) {
    conditions.push(`entity_id = $${paramIndex}`);
    params.push(filter.entityId);
    paramIndex++;
  }

  if (filter.userId) {
    conditions.push(`user_id = $${paramIndex}`);
    params.push(filter.userId);
    paramIndex++;
  }

  if (filter.action) {
    conditions.push(`action = $${paramIndex}`);
    params.push(filter.action);
    paramIndex++;
  }

  if (filter.startDate) {
    conditions.push(`timestamp >= $${paramIndex}`);
    params.push(filter.startDate);
    paramIndex++;
  }

  if (filter.endDate) {
    conditions.push(`timestamp <= $${paramIndex}`);
    params.push(filter.endDate);
    paramIndex++;
  }

  // Build the query
  let query = 'SELECT * FROM audit_logs';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Add ordering
  query += ' ORDER BY timestamp DESC';

  // Add pagination
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit);
  params.push((page - 1) * limit);

  // Count total records for pagination
  let countQuery = 'SELECT COUNT(*) FROM audit_logs';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }

  // Execute the queries
  const [results, countResult] = await Promise.all([
    db.query(query, params),
    db.query(countQuery, params.slice(0, params.length - 2)) // Remove pagination params
  ]);

  const totalCount = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(totalCount / limit);

  return {
    logs: results.rows.map(mapAuditLogFromDb),
    totalCount,
    page,
    limit,
    totalPages
  };
}

/**
 * Map database audit log to AuditLog type
 */
function mapAuditLogFromDb(dbLog: any): AuditLog {
  return {
    id: dbLog.id,
    userId: dbLog.user_id,
    entityType: dbLog.entity_type,
    entityId: dbLog.entity_id,
    action: dbLog.action,
    details: typeof dbLog.details === 'string' ? JSON.parse(dbLog.details) : dbLog.details,
    ipAddress: dbLog.ip_address,
    userAgent: dbLog.user_agent,
    timestamp: new Date(dbLog.timestamp),
  };
}
