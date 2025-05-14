/**
 * Repository for government portal integration
 */
import { v4 as uuidv4 } from 'uuid';
import pool from '../lib/db';
import {
  GovernmentPortalType,
  PortalFieldMapping,
  PortalFieldMappingCreateData,
  PortalFieldMappingUpdateData,
  PortalSubmission,
  PortalSubmissionCreateData,
  PortalSubmissionStatus,
  PortalSubmissionUpdateData,
} from '../types/portal';

/**
 * Get all field mappings for a portal type
 */
export async function getFieldMappingsByPortalType(
  portalType: GovernmentPortalType
): Promise<PortalFieldMapping[]> {
  const query = `
    SELECT * FROM portal_field_mappings
    WHERE portal_type = $1
    ORDER BY created_at ASC
  `;
  
  const result = await pool.query(query, [portalType]);
  
  return result.rows.map((row) => ({
    id: row.id,
    portalType: row.portal_type,
    formField: row.form_field,
    portalField: row.portal_field,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new field mapping
 */
export async function createFieldMapping(
  data: PortalFieldMappingCreateData
): Promise<PortalFieldMapping> {
  const id = uuidv4();
  const now = new Date();
  
  const query = `
    INSERT INTO portal_field_mappings (
      id, portal_type, form_field, portal_field, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const values = [
    id,
    data.portalType,
    data.formField,
    data.portalField,
    now,
    now,
  ];
  
  const result = await pool.query(query, values);
  const row = result.rows[0];
  
  return {
    id: row.id,
    portalType: row.portal_type,
    formField: row.form_field,
    portalField: row.portal_field,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Update a field mapping
 */
export async function updateFieldMapping(
  id: string,
  data: PortalFieldMappingUpdateData
): Promise<PortalFieldMapping | null> {
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.portalField !== undefined) {
    updateFields.push(`portal_field = $${paramIndex}`);
    values.push(data.portalField);
    paramIndex++;
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  updateFields.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  paramIndex++;
  
  values.push(id);
  
  const query = `
    UPDATE portal_field_mappings
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex - 1}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  
  return {
    id: row.id,
    portalType: row.portal_type,
    formField: row.form_field,
    portalField: row.portal_field,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Delete a field mapping
 */
export async function deleteFieldMapping(id: string): Promise<boolean> {
  const query = `
    DELETE FROM portal_field_mappings
    WHERE id = $1
  `;
  
  const result = await pool.query(query, [id]);
  
  return result.rowCount > 0;
}

/**
 * Get a portal submission by ID
 */
export async function getPortalSubmissionById(
  id: string
): Promise<PortalSubmission | null> {
  const query = `
    SELECT * FROM portal_submissions
    WHERE id = $1
  `;
  
  const result = await pool.query(query, [id]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  
  return {
    id: row.id,
    formSubmissionId: row.form_submission_id,
    portalType: row.portal_type,
    status: row.status,
    confirmationNumber: row.confirmation_number,
    confirmationReceiptUrl: row.confirmation_receipt_url,
    errorMessage: row.error_message,
    retryCount: row.retry_count,
    lastAttemptAt: row.last_attempt_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get portal submission by form submission ID
 */
export async function getPortalSubmissionByFormSubmissionId(
  formSubmissionId: string
): Promise<PortalSubmission | null> {
  const query = `
    SELECT * FROM portal_submissions
    WHERE form_submission_id = $1
  `;
  
  const result = await pool.query(query, [formSubmissionId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  
  return {
    id: row.id,
    formSubmissionId: row.form_submission_id,
    portalType: row.portal_type,
    status: row.status,
    confirmationNumber: row.confirmation_number,
    confirmationReceiptUrl: row.confirmation_receipt_url,
    errorMessage: row.error_message,
    retryCount: row.retry_count,
    lastAttemptAt: row.last_attempt_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new portal submission
 */
export async function createPortalSubmission(
  data: PortalSubmissionCreateData
): Promise<PortalSubmission> {
  const id = uuidv4();
  const now = new Date();
  
  const query = `
    INSERT INTO portal_submissions (
      id, form_submission_id, portal_type, status, retry_count, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const values = [
    id,
    data.formSubmissionId,
    data.portalType,
    PortalSubmissionStatus.PENDING,
    0,
    now,
    now,
  ];
  
  const result = await pool.query(query, values);
  const row = result.rows[0];
  
  return {
    id: row.id,
    formSubmissionId: row.form_submission_id,
    portalType: row.portal_type,
    status: row.status,
    confirmationNumber: row.confirmation_number,
    confirmationReceiptUrl: row.confirmation_receipt_url,
    errorMessage: row.error_message,
    retryCount: row.retry_count,
    lastAttemptAt: row.last_attempt_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Update a portal submission
 */
export async function updatePortalSubmission(
  id: string,
  data: PortalSubmissionUpdateData
): Promise<PortalSubmission | null> {
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.status !== undefined) {
    updateFields.push(`status = $${paramIndex}`);
    values.push(data.status);
    paramIndex++;
  }
  
  if (data.confirmationNumber !== undefined) {
    updateFields.push(`confirmation_number = $${paramIndex}`);
    values.push(data.confirmationNumber);
    paramIndex++;
  }
  
  if (data.confirmationReceiptUrl !== undefined) {
    updateFields.push(`confirmation_receipt_url = $${paramIndex}`);
    values.push(data.confirmationReceiptUrl);
    paramIndex++;
  }
  
  if (data.errorMessage !== undefined) {
    updateFields.push(`error_message = $${paramIndex}`);
    values.push(data.errorMessage);
    paramIndex++;
  }
  
  if (data.retryCount !== undefined) {
    updateFields.push(`retry_count = $${paramIndex}`);
    values.push(data.retryCount);
    paramIndex++;
  }
  
  if (data.lastAttemptAt !== undefined) {
    updateFields.push(`last_attempt_at = $${paramIndex}`);
    values.push(data.lastAttemptAt);
    paramIndex++;
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  updateFields.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  paramIndex++;
  
  values.push(id);
  
  const query = `
    UPDATE portal_submissions
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex - 1}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  
  return {
    id: row.id,
    formSubmissionId: row.form_submission_id,
    portalType: row.portal_type,
    status: row.status,
    confirmationNumber: row.confirmation_number,
    confirmationReceiptUrl: row.confirmation_receipt_url,
    errorMessage: row.error_message,
    retryCount: row.retry_count,
    lastAttemptAt: row.last_attempt_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get pending portal submissions
 */
export async function getPendingPortalSubmissions(): Promise<PortalSubmission[]> {
  const query = `
    SELECT * FROM portal_submissions
    WHERE status IN ($1, $2, $3)
    ORDER BY created_at ASC
  `;
  
  const result = await pool.query(query, [
    PortalSubmissionStatus.PENDING,
    PortalSubmissionStatus.FAILED,
    PortalSubmissionStatus.RETRYING,
  ]);
  
  return result.rows.map((row) => ({
    id: row.id,
    formSubmissionId: row.form_submission_id,
    portalType: row.portal_type,
    status: row.status,
    confirmationNumber: row.confirmation_number,
    confirmationReceiptUrl: row.confirmation_receipt_url,
    errorMessage: row.error_message,
    retryCount: row.retry_count,
    lastAttemptAt: row.last_attempt_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
