import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { Document, DocumentStatus, DocumentType, DocumentUpdateData } from '@/types/document';

/**
 * Create a new document
 */
export async function createDocument(documentData: {
  caseId: string;
  type: DocumentType;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  validUntil?: Date;
}): Promise<Document> {
  const documentId = uuidv4();
  const now = new Date();
  
  const result = await db.query(
    `INSERT INTO documents (
      id, case_id, type, status, file_path, file_name, file_size, mime_type, 
      uploaded_by, valid_until, version, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      documentId,
      documentData.caseId,
      documentData.type,
      DocumentStatus.PENDING,
      documentData.filePath,
      documentData.fileName,
      documentData.fileSize,
      documentData.mimeType,
      documentData.uploadedBy,
      documentData.validUntil || null,
      1, // Initial version
      now,
      now,
    ]
  );
  
  return mapDocumentFromDb(result.rows[0]);
}

/**
 * Get document by ID
 */
export async function getDocumentById(id: string): Promise<Document | null> {
  const result = await db.query(
    `SELECT * FROM documents 
     WHERE id = $1 AND is_deleted = FALSE`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapDocumentFromDb(result.rows[0]);
}

/**
 * Get documents by case ID
 */
export async function getDocumentsByCaseId(caseId: string): Promise<Document[]> {
  const result = await db.query(
    `SELECT * FROM documents 
     WHERE case_id = $1 AND is_deleted = FALSE
     ORDER BY created_at DESC`,
    [caseId]
  );
  
  return result.rows.map(mapDocumentFromDb);
}

/**
 * Get documents by user ID (documents uploaded by the user)
 */
export async function getDocumentsByUserId(userId: string): Promise<Document[]> {
  const result = await db.query(
    `SELECT * FROM documents 
     WHERE uploaded_by = $1 AND is_deleted = FALSE
     ORDER BY created_at DESC`,
    [userId]
  );
  
  return result.rows.map(mapDocumentFromDb);
}

/**
 * Update document
 */
export async function updateDocument(id: string, updateData: DocumentUpdateData): Promise<Document | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  // Add status update if provided
  if (updateData.status !== undefined) {
    updates.push(`status = $${paramIndex}`);
    values.push(updateData.status);
    paramIndex++;
  }
  
  // Add validUntil update if provided
  if (updateData.validUntil !== undefined) {
    updates.push(`valid_until = $${paramIndex}`);
    values.push(updateData.validUntil ? new Date(updateData.validUntil) : null);
    paramIndex++;
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  paramIndex++;
  
  // Add document ID as the last parameter
  values.push(id);
  
  // If no updates, return null
  if (updates.length === 1) { // Only updated_at
    return getDocumentById(id);
  }
  
  const result = await db.query(
    `UPDATE documents 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex} AND is_deleted = FALSE
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapDocumentFromDb(result.rows[0]);
}

/**
 * Soft delete document
 */
export async function deleteDocument(id: string): Promise<boolean> {
  const result = await db.query(
    `UPDATE documents 
     SET is_deleted = TRUE, updated_at = $1
     WHERE id = $2 AND is_deleted = FALSE
     RETURNING id`,
    [new Date(), id]
  );
  
  return result.rows.length > 0;
}

/**
 * Map database document to Document type
 */
function mapDocumentFromDb(dbDocument: any): Document {
  return {
    id: dbDocument.id,
    caseId: dbDocument.case_id,
    type: dbDocument.type,
    status: dbDocument.status,
    filePath: dbDocument.file_path,
    fileName: dbDocument.file_name,
    fileSize: dbDocument.file_size,
    mimeType: dbDocument.mime_type,
    uploadedBy: dbDocument.uploaded_by,
    validUntil: dbDocument.valid_until ? new Date(dbDocument.valid_until) : undefined,
    version: dbDocument.version,
    isDeleted: dbDocument.is_deleted,
    createdAt: new Date(dbDocument.created_at),
    updatedAt: new Date(dbDocument.updated_at),
  };
}
