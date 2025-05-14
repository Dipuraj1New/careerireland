import { 
  Document, 
  DocumentStatus, 
  DocumentType, 
  DocumentUpdateData, 
  DocumentValidationResult,
  DocumentWithValidation
} from '@/types/document';
import { 
  createDocument, 
  getDocumentById, 
  getDocumentsByCaseId, 
  updateDocument, 
  deleteDocument 
} from './documentRepository';
import { 
  uploadFile, 
  getFileUrl, 
  deleteFile 
} from './documentStorageService';

/**
 * Upload a new document
 */
export async function uploadDocument(
  file: File,
  caseId: string,
  type: DocumentType,
  userId: string,
  validUntil?: string
): Promise<DocumentWithValidation> {
  try {
    // Upload file to storage
    const { filePath, fileSize } = await uploadFile(file, caseId, userId);
    
    // Create document record in database
    const document = await createDocument({
      caseId,
      type,
      filePath,
      fileName: file.name,
      fileSize,
      mimeType: file.type,
      uploadedBy: userId,
      validUntil: validUntil ? new Date(validUntil) : undefined,
    });
    
    // Perform initial validation
    const validationResults = await validateDocument(document);
    
    return {
      ...document,
      validationResults,
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

/**
 * Get document by ID with download URL
 */
export async function getDocument(id: string): Promise<DocumentWithValidation | null> {
  try {
    const document = await getDocumentById(id);
    
    if (!document) {
      return null;
    }
    
    // Get download URL
    const downloadUrl = await getFileUrl(document.filePath);
    
    // Get validation results
    const validationResults = await validateDocument(document);
    
    return {
      ...document,
      filePath: downloadUrl, // Replace storage path with download URL
      validationResults,
    };
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
}

/**
 * Get documents by case ID with download URLs
 */
export async function getDocumentsByCase(caseId: string): Promise<DocumentWithValidation[]> {
  try {
    const documents = await getDocumentsByCaseId(caseId);
    
    // Get download URLs and validation results for each document
    const documentsWithUrls = await Promise.all(
      documents.map(async (document) => {
        const downloadUrl = await getFileUrl(document.filePath);
        const validationResults = await validateDocument(document);
        
        return {
          ...document,
          filePath: downloadUrl, // Replace storage path with download URL
          validationResults,
        };
      })
    );
    
    return documentsWithUrls;
  } catch (error) {
    console.error('Error getting documents by case:', error);
    throw error;
  }
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  validUntil?: string
): Promise<DocumentWithValidation | null> {
  try {
    const updateData: DocumentUpdateData = {
      status,
    };
    
    if (validUntil !== undefined) {
      updateData.validUntil = validUntil;
    }
    
    const document = await updateDocument(id, updateData);
    
    if (!document) {
      return null;
    }
    
    // Get download URL
    const downloadUrl = await getFileUrl(document.filePath);
    
    // Get validation results
    const validationResults = await validateDocument(document);
    
    return {
      ...document,
      filePath: downloadUrl, // Replace storage path with download URL
      validationResults,
    };
  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
}

/**
 * Delete document
 */
export async function removeDocument(id: string): Promise<boolean> {
  try {
    // Get document to get file path
    const document = await getDocumentById(id);
    
    if (!document) {
      return false;
    }
    
    // Soft delete document in database
    const deleted = await deleteDocument(id);
    
    if (deleted) {
      // Delete file from storage
      await deleteFile(document.filePath);
    }
    
    return deleted;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Validate document
 * This is a placeholder for more complex validation logic that would be implemented
 * in the AI Document Processing module
 */
async function validateDocument(document: Document): Promise<DocumentValidationResult> {
  // Simple validation based on document type
  const issues: string[] = [];
  
  // Check if document is expired
  if (document.validUntil && new Date(document.validUntil) < new Date()) {
    issues.push('Document has expired');
  }
  
  // Add type-specific validation
  switch (document.type) {
    case DocumentType.PASSPORT:
      // Passport-specific validation would go here
      break;
    case DocumentType.FINANCIAL:
      // Financial document validation would go here
      break;
    // Add more document type validations as needed
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}
