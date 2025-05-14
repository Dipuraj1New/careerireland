/**
 * Form Submission Repository
 *
 * Handles database operations for form submissions.
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import {
  FormSubmission,
  FormSubmissionStatus,
  FormSignature,
  FormSubmissionCreateData,
  FormSignatureCreateData,
  SignatureType
} from '@/types/form';

/**
 * Create a new form submission
 */
export async function createFormSubmission(
  submissionData: FormSubmissionCreateData,
  userId: string,
  templateVersion: number
): Promise<FormSubmission> {
  const submissionId = uuidv4();
  const now = new Date();

  const result = await db.query(
    `INSERT INTO form_submissions (
      id, template_id, template_version, case_id, user_id, form_data,
      file_path, file_name, file_size, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      submissionId,
      submissionData.templateId,
      templateVersion,
      submissionData.caseId,
      userId,
      JSON.stringify(submissionData.formData),
      submissionData.filePath,
      submissionData.fileName,
      submissionData.fileSize,
      FormSubmissionStatus.GENERATED,
      now,
      now,
    ]
  );

  return mapFormSubmissionFromDb(result.rows[0]);
}

/**
 * Get form submission by ID
 */
export async function getFormSubmissionById(id: string): Promise<FormSubmission | null> {
  const result = await db.query(
    `SELECT * FROM form_submissions
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const submission = mapFormSubmissionFromDb(result.rows[0]);

  // Get signatures
  const signatures = await getFormSignaturesBySubmissionId(id);
  submission.signatures = signatures;

  return submission;
}

/**
 * Get form submissions by case ID
 */
export async function getFormSubmissionsByCaseId(caseId: string): Promise<FormSubmission[]> {
  const result = await db.query(
    `SELECT * FROM form_submissions
     WHERE case_id = $1
     ORDER BY created_at DESC`,
    [caseId]
  );

  const submissions = result.rows.map(mapFormSubmissionFromDb);

  // Get signatures for each submission
  for (const submission of submissions) {
    submission.signatures = await getFormSignaturesBySubmissionId(submission.id);
  }

  return submissions;
}

/**
 * Get form submissions by user ID
 */
export async function getFormSubmissionsByUserId(userId: string): Promise<FormSubmission[]> {
  const result = await db.query(
    `SELECT * FROM form_submissions
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  const submissions = result.rows.map(mapFormSubmissionFromDb);

  // Get signatures for each submission
  for (const submission of submissions) {
    submission.signatures = await getFormSignaturesBySubmissionId(submission.id);
  }

  return submissions;
}

/**
 * Update form submission status
 */
export async function updateFormSubmissionStatus(
  id: string,
  status: FormSubmissionStatus,
  submittedAt?: Date
): Promise<FormSubmission | null> {
  const now = new Date();

  const result = await db.query(
    `UPDATE form_submissions
     SET status = $1,
         submitted_at = $2,
         updated_at = $3
     WHERE id = $4
     RETURNING *`,
    [
      status,
      submittedAt || (status === FormSubmissionStatus.SUBMITTED ? now : null),
      now,
      id,
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const submission = mapFormSubmissionFromDb(result.rows[0]);

  // Get signatures
  submission.signatures = await getFormSignaturesBySubmissionId(id);

  return submission;
}

/**
 * Create a form signature
 */
export async function createFormSignature(
  signatureData: FormSignatureCreateData,
  userId: string
): Promise<FormSignature> {
  const signatureId = uuidv4();
  const now = new Date();

  const result = await db.query(
    `INSERT INTO form_signatures (
      id, submission_id, user_id, signature_data, signature_type,
      ip_address, user_agent, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      signatureId,
      signatureData.submissionId,
      userId,
      signatureData.signatureData,
      signatureData.signatureType,
      signatureData.ipAddress || null,
      signatureData.userAgent || null,
      now,
    ]
  );

  return mapFormSignatureFromDb(result.rows[0]);
}

/**
 * Get form signatures by submission ID
 */
export async function getFormSignaturesBySubmissionId(submissionId: string): Promise<FormSignature[]> {
  const result = await db.query(
    `SELECT * FROM form_signatures
     WHERE submission_id = $1
     ORDER BY created_at DESC`,
    [submissionId]
  );

  return result.rows.map(mapFormSignatureFromDb);
}

/**
 * Get form signature by ID
 */
export async function getFormSignatureById(id: string): Promise<FormSignature | null> {
  const result = await db.query(
    `SELECT * FROM form_signatures
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapFormSignatureFromDb(result.rows[0]);
}

/**
 * Map database row to FormSubmission
 */
function mapFormSubmissionFromDb(row: any): FormSubmission {
  return {
    id: row.id,
    templateId: row.template_id,
    templateVersion: row.template_version,
    caseId: row.case_id,
    userId: row.user_id,
    formData: row.form_data,
    filePath: row.file_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    status: row.status as FormSubmissionStatus,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to FormSignature
 */
function mapFormSignatureFromDb(row: any): FormSignature {
  return {
    id: row.id,
    submissionId: row.submission_id,
    userId: row.user_id,
    signatureData: row.signature_data,
    signatureType: row.signature_type as SignatureType,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}
