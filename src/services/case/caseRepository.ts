import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { Case, CaseStatus, CasePriority, VisaType, CaseCreateData, CaseUpdateData } from '@/types/case';

/**
 * Create a new case
 */
export async function createCase(caseData: CaseCreateData): Promise<Case> {
  const caseId = uuidv4();
  const now = new Date();
  
  const result = await db.query(
    `INSERT INTO cases (
      id, applicant_id, agent_id, visa_type, status, priority, notes, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      caseId,
      caseData.applicantId,
      caseData.agentId || null,
      caseData.visaType,
      CaseStatus.DRAFT, // Initial status is always draft
      caseData.priority || CasePriority.STANDARD,
      caseData.notes || null,
      now,
      now,
    ]
  );
  
  return mapCaseFromDb(result.rows[0]);
}

/**
 * Get case by ID
 */
export async function getCaseById(id: string): Promise<Case | null> {
  const result = await db.query(
    `SELECT * FROM cases 
     WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapCaseFromDb(result.rows[0]);
}

/**
 * Get cases by applicant ID
 */
export async function getCasesByApplicantId(applicantId: string): Promise<Case[]> {
  const result = await db.query(
    `SELECT * FROM cases 
     WHERE applicant_id = $1
     ORDER BY created_at DESC`,
    [applicantId]
  );
  
  return result.rows.map(mapCaseFromDb);
}

/**
 * Get cases by agent ID
 */
export async function getCasesByAgentId(agentId: string): Promise<Case[]> {
  const result = await db.query(
    `SELECT * FROM cases 
     WHERE agent_id = $1
     ORDER BY created_at DESC`,
    [agentId]
  );
  
  return result.rows.map(mapCaseFromDb);
}

/**
 * Get cases by status
 */
export async function getCasesByStatus(status: CaseStatus): Promise<Case[]> {
  const result = await db.query(
    `SELECT * FROM cases 
     WHERE status = $1
     ORDER BY created_at DESC`,
    [status]
  );
  
  return result.rows.map(mapCaseFromDb);
}

/**
 * Update case
 */
export async function updateCase(id: string, updateData: CaseUpdateData): Promise<Case | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  // Add agent_id update if provided
  if (updateData.agentId !== undefined) {
    updates.push(`agent_id = $${paramIndex}`);
    values.push(updateData.agentId || null);
    paramIndex++;
  }
  
  // Add status update if provided
  if (updateData.status !== undefined) {
    updates.push(`status = $${paramIndex}`);
    values.push(updateData.status);
    paramIndex++;
    
    // If status is changing to submitted, set submission_date
    if (updateData.status === CaseStatus.SUBMITTED) {
      updates.push(`submission_date = $${paramIndex}`);
      values.push(new Date());
      paramIndex++;
    }
    
    // If status is changing to approved or rejected, set decision_date
    if (updateData.status === CaseStatus.APPROVED || updateData.status === CaseStatus.REJECTED) {
      updates.push(`decision_date = $${paramIndex}`);
      values.push(new Date());
      paramIndex++;
    }
  }
  
  // Add priority update if provided
  if (updateData.priority !== undefined) {
    updates.push(`priority = $${paramIndex}`);
    values.push(updateData.priority);
    paramIndex++;
  }
  
  // Add notes update if provided
  if (updateData.notes !== undefined) {
    updates.push(`notes = $${paramIndex}`);
    values.push(updateData.notes);
    paramIndex++;
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  paramIndex++;
  
  // Add case ID as the last parameter
  values.push(id);
  
  // If no updates, return null
  if (updates.length === 1) { // Only updated_at
    return getCaseById(id);
  }
  
  const result = await db.query(
    `UPDATE cases 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapCaseFromDb(result.rows[0]);
}

/**
 * Delete case
 * Note: This is a hard delete and should be used with caution
 */
export async function deleteCase(id: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM cases 
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  
  return result.rows.length > 0;
}

/**
 * Map database case to Case type
 */
function mapCaseFromDb(dbCase: any): Case {
  return {
    id: dbCase.id,
    applicantId: dbCase.applicant_id,
    agentId: dbCase.agent_id,
    visaType: dbCase.visa_type,
    status: dbCase.status,
    submissionDate: dbCase.submission_date ? new Date(dbCase.submission_date) : undefined,
    decisionDate: dbCase.decision_date ? new Date(dbCase.decision_date) : undefined,
    priority: dbCase.priority,
    notes: dbCase.notes,
    createdAt: new Date(dbCase.created_at),
    updatedAt: new Date(dbCase.updated_at),
  };
}
