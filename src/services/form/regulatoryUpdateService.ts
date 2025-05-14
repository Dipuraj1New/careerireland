/**
 * Regulatory Update Service
 * 
 * Manages regulatory updates for form templates.
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { createAuditLog } from '@/services/audit/auditService';
import { sendNotification } from '@/services/notification/notificationService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import { NotificationType } from '@/types/notification';
import { UserRole } from '@/types/user';
import * as userService from '@/services/user/userService';

export interface RegulatoryUpdate {
  id: string;
  templateId: string;
  title: string;
  description: string;
  regulatoryReference: string;
  effectiveDate: Date;
  changeDescription: string;
  status: 'pending' | 'in_progress' | 'completed';
  notifyUsers: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedBy?: string;
  completedDate?: Date;
  implementationNotes?: string;
}

export interface RegulatoryUpdateCreateData {
  templateId: string;
  title: string;
  description: string;
  regulatoryReference: string;
  effectiveDate: Date;
  changeDescription: string;
  notifyUsers: boolean;
  userId: string;
}

export interface RegulatoryUpdateCompleteData {
  implementationNotes?: string;
  userId: string;
}

/**
 * Create a new regulatory update
 */
export async function createRegulatoryUpdate(
  data: RegulatoryUpdateCreateData
): Promise<RegulatoryUpdate> {
  const id = uuidv4();
  const now = new Date();
  
  const result = await db.query(
    `INSERT INTO regulatory_updates (
      id, template_id, title, description, regulatory_reference, 
      effective_date, change_description, status, notify_users,
      created_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      id,
      data.templateId,
      data.title,
      data.description,
      data.regulatoryReference,
      data.effectiveDate,
      data.changeDescription,
      'pending',
      data.notifyUsers,
      data.userId,
      now,
      now,
    ]
  );
  
  // Create audit log
  await createAuditLog({
    userId: data.userId,
    entityType: AuditEntityType.FORM_TEMPLATE,
    entityId: data.templateId,
    action: AuditAction.CREATE,
    details: {
      regulatoryUpdateId: id,
      title: data.title,
      regulatoryReference: data.regulatoryReference,
    },
  });
  
  return mapRegulatoryUpdateFromDb(result.rows[0]);
}

/**
 * Get regulatory updates for a template
 */
export async function getRegulatoryUpdates(templateId: string): Promise<RegulatoryUpdate[]> {
  const result = await db.query(
    `SELECT * FROM regulatory_updates 
     WHERE template_id = $1 
     ORDER BY created_at DESC`,
    [templateId]
  );
  
  return result.rows.map(mapRegulatoryUpdateFromDb);
}

/**
 * Get regulatory update by ID
 */
export async function getRegulatoryUpdateById(id: string): Promise<RegulatoryUpdate | null> {
  const result = await db.query(
    `SELECT * FROM regulatory_updates 
     WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapRegulatoryUpdateFromDb(result.rows[0]);
}

/**
 * Update regulatory update status
 */
export async function updateRegulatoryUpdateStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'completed',
  userId: string
): Promise<RegulatoryUpdate | null> {
  const now = new Date();
  
  let query = `
    UPDATE regulatory_updates 
    SET status = $1, updated_at = $2
  `;
  
  const params: any[] = [status, now];
  
  // If status is completed, add completed_by and completed_date
  if (status === 'completed') {
    query += `, completed_by = $3, completed_date = $4`;
    params.push(userId, now);
  }
  
  query += ` WHERE id = $${params.length + 1} RETURNING *`;
  params.push(id);
  
  const result = await db.query(query, params);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Create audit log
  await createAuditLog({
    userId,
    entityType: AuditEntityType.FORM_TEMPLATE,
    entityId: result.rows[0].template_id,
    action: AuditAction.UPDATE_STATUS,
    details: {
      regulatoryUpdateId: id,
      status,
    },
  });
  
  return mapRegulatoryUpdateFromDb(result.rows[0]);
}

/**
 * Complete a regulatory update
 */
export async function completeRegulatoryUpdate(
  id: string,
  data: RegulatoryUpdateCompleteData
): Promise<RegulatoryUpdate | null> {
  const now = new Date();
  
  const result = await db.query(
    `UPDATE regulatory_updates 
     SET status = $1, 
         completed_by = $2, 
         completed_date = $3, 
         implementation_notes = $4,
         updated_at = $5
     WHERE id = $6 
     RETURNING *`,
    [
      'completed',
      data.userId,
      now,
      data.implementationNotes || null,
      now,
      id,
    ]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const update = mapRegulatoryUpdateFromDb(result.rows[0]);
  
  // Create audit log
  await createAuditLog({
    userId: data.userId,
    entityType: AuditEntityType.FORM_TEMPLATE,
    entityId: update.templateId,
    action: AuditAction.UPDATE_STATUS,
    details: {
      regulatoryUpdateId: id,
      status: 'completed',
    },
  });
  
  return update;
}

/**
 * Send notifications about a regulatory update
 */
export async function sendRegulatoryUpdateNotifications(
  regulatoryUpdateId: string
): Promise<void> {
  // Get the regulatory update
  const update = await getRegulatoryUpdateById(regulatoryUpdateId);
  
  if (!update) {
    throw new Error(`Regulatory update with ID ${regulatoryUpdateId} not found`);
  }
  
  // Get users to notify (admins and agents)
  const users = await userService.getUsersByRoles([UserRole.ADMIN, UserRole.AGENT]);
  
  // Send notifications
  for (const user of users) {
    await sendNotification({
      userId: user.id,
      type: NotificationType.REGULATORY_UPDATE,
      title: `Regulatory Update: ${update.title}`,
      message: `A new regulatory update has been created for a form template: ${update.title}. Reference: ${update.regulatoryReference}. Effective date: ${update.effectiveDate.toISOString().split('T')[0]}.`,
      data: {
        regulatoryUpdateId: update.id,
        templateId: update.templateId,
      },
    });
  }
}

/**
 * Map database row to RegulatoryUpdate
 */
function mapRegulatoryUpdateFromDb(row: any): RegulatoryUpdate {
  return {
    id: row.id,
    templateId: row.template_id,
    title: row.title,
    description: row.description,
    regulatoryReference: row.regulatory_reference,
    effectiveDate: row.effective_date,
    changeDescription: row.change_description,
    status: row.status,
    notifyUsers: row.notify_users,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedBy: row.completed_by,
    completedDate: row.completed_date,
    implementationNotes: row.implementation_notes,
  };
}
