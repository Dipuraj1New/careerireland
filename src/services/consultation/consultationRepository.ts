/**
 * Consultation Repository
 * 
 * Handles database operations for consultations and related entities
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import {
  Consultation,
  ConsultationCreateData,
  ConsultationUpdateData,
  ConsultationStatus
} from '@/types/consultation';

/**
 * Map database row to Consultation object
 */
function mapConsultationFromDb(row: any): Consultation {
  return {
    id: row.id,
    expertId: row.expert_id,
    applicantId: row.applicant_id,
    caseId: row.case_id,
    title: row.title,
    description: row.description,
    scheduledAt: row.scheduled_at,
    duration: row.duration,
    status: row.status,
    meetingUrl: row.meeting_url,
    meetingId: row.meeting_id,
    meetingPassword: row.meeting_password,
    recordingUrl: row.recording_url,
    transcriptUrl: row.transcript_url,
    notes: row.notes,
    feedbackRating: row.feedback_rating,
    feedbackComment: row.feedback_comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Create a new consultation
 */
export async function createConsultation(data: ConsultationCreateData): Promise<Consultation> {
  const id = uuidv4();
  const status = data.status || ConsultationStatus.SCHEDULED;
  
  const result = await db.query(
    `INSERT INTO consultations (
      id, expert_id, applicant_id, case_id, title, description, 
      scheduled_at, duration, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      id, data.expertId, data.applicantId, data.caseId, data.title, 
      data.description, data.scheduledAt, data.duration, status
    ]
  );
  
  return mapConsultationFromDb(result.rows[0]);
}

/**
 * Get consultation by ID
 */
export async function getConsultationById(id: string): Promise<Consultation | null> {
  const result = await db.query(
    `SELECT * FROM consultations WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapConsultationFromDb(result.rows[0]);
}

/**
 * Update consultation
 */
export async function updateConsultation(
  id: string, 
  data: ConsultationUpdateData
): Promise<Consultation | null> {
  // Build the SET clause dynamically based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  // Add each field that is present in the update data
  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  
  if (data.scheduledAt !== undefined) {
    updates.push(`scheduled_at = $${paramIndex++}`);
    values.push(data.scheduledAt);
  }
  
  if (data.duration !== undefined) {
    updates.push(`duration = $${paramIndex++}`);
    values.push(data.duration);
  }
  
  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }
  
  if (data.meetingUrl !== undefined) {
    updates.push(`meeting_url = $${paramIndex++}`);
    values.push(data.meetingUrl);
  }
  
  if (data.meetingId !== undefined) {
    updates.push(`meeting_id = $${paramIndex++}`);
    values.push(data.meetingId);
  }
  
  if (data.meetingPassword !== undefined) {
    updates.push(`meeting_password = $${paramIndex++}`);
    values.push(data.meetingPassword);
  }
  
  if (data.recordingUrl !== undefined) {
    updates.push(`recording_url = $${paramIndex++}`);
    values.push(data.recordingUrl);
  }
  
  if (data.transcriptUrl !== undefined) {
    updates.push(`transcript_url = $${paramIndex++}`);
    values.push(data.transcriptUrl);
  }
  
  if (data.notes !== undefined) {
    updates.push(`notes = $${paramIndex++}`);
    values.push(data.notes);
  }
  
  if (data.feedbackRating !== undefined) {
    updates.push(`feedback_rating = $${paramIndex++}`);
    values.push(data.feedbackRating);
  }
  
  if (data.feedbackComment !== undefined) {
    updates.push(`feedback_comment = $${paramIndex++}`);
    values.push(data.feedbackComment);
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = NOW()`);
  
  // If no fields to update, return the existing consultation
  if (updates.length === 1) {
    return getConsultationById(id);
  }
  
  // Add the ID as the last parameter
  values.push(id);
  
  const result = await db.query(
    `UPDATE consultations 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapConsultationFromDb(result.rows[0]);
}

/**
 * Get consultations by expert ID
 */
export async function getConsultationsByExpertId(
  expertId: string,
  options: {
    status?: ConsultationStatus | ConsultationStatus[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Consultation[]> {
  let query = `SELECT * FROM consultations WHERE expert_id = $1`;
  const params: any[] = [expertId];
  let paramIndex = 2;
  
  // Add filters
  if (options.status) {
    if (Array.isArray(options.status)) {
      query += ` AND status = ANY($${paramIndex++})`;
      params.push(options.status);
    } else {
      query += ` AND status = $${paramIndex++}`;
      params.push(options.status);
    }
  }
  
  if (options.startDate) {
    query += ` AND scheduled_at >= $${paramIndex++}`;
    params.push(options.startDate);
  }
  
  if (options.endDate) {
    query += ` AND scheduled_at <= $${paramIndex++}`;
    params.push(options.endDate);
  }
  
  // Add sorting
  query += ` ORDER BY scheduled_at ASC`;
  
  // Add pagination
  if (options.limit) {
    query += ` LIMIT $${paramIndex++}`;
    params.push(options.limit);
  }
  
  if (options.offset) {
    query += ` OFFSET $${paramIndex++}`;
    params.push(options.offset);
  }
  
  const result = await db.query(query, params);
  
  return result.rows.map(mapConsultationFromDb);
}

/**
 * Get consultations by applicant ID
 */
export async function getConsultationsByApplicantId(
  applicantId: string,
  options: {
    status?: ConsultationStatus | ConsultationStatus[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Consultation[]> {
  let query = `SELECT * FROM consultations WHERE applicant_id = $1`;
  const params: any[] = [applicantId];
  let paramIndex = 2;
  
  // Add filters
  if (options.status) {
    if (Array.isArray(options.status)) {
      query += ` AND status = ANY($${paramIndex++})`;
      params.push(options.status);
    } else {
      query += ` AND status = $${paramIndex++}`;
      params.push(options.status);
    }
  }
  
  if (options.startDate) {
    query += ` AND scheduled_at >= $${paramIndex++}`;
    params.push(options.startDate);
  }
  
  if (options.endDate) {
    query += ` AND scheduled_at <= $${paramIndex++}`;
    params.push(options.endDate);
  }
  
  // Add sorting
  query += ` ORDER BY scheduled_at DESC`;
  
  // Add pagination
  if (options.limit) {
    query += ` LIMIT $${paramIndex++}`;
    params.push(options.limit);
  }
  
  if (options.offset) {
    query += ` OFFSET $${paramIndex++}`;
    params.push(options.offset);
  }
  
  const result = await db.query(query, params);
  
  return result.rows.map(mapConsultationFromDb);
}

/**
 * Get consultations by case ID
 */
export async function getConsultationsByCaseId(caseId: string): Promise<Consultation[]> {
  const result = await db.query(
    `SELECT * FROM consultations 
     WHERE case_id = $1
     ORDER BY scheduled_at DESC`,
    [caseId]
  );
  
  return result.rows.map(mapConsultationFromDb);
}

/**
 * Delete consultation
 */
export async function deleteConsultation(id: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM consultations WHERE id = $1 RETURNING id`,
    [id]
  );
  
  return result.rows.length > 0;
}
