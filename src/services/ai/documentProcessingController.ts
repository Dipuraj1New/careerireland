/**
 * Document Processing Controller
 * 
 * Handles the orchestration of document processing, including:
 * - Retrieving document from storage
 * - Processing with AI services
 * - Updating document metadata
 * - Creating notifications
 */
import { DocumentType, DocumentStatus, AIProcessingResults } from '@/types/document';
import { NotificationType } from '@/types/notification';
import { getDocumentById, updateDocument } from '@/services/document/documentRepository';
import { getFileFromStorage } from '@/services/storage/storageService';
import documentProcessor from './documentProcessingService';
import { createNotification } from '@/services/notification/notificationService';

interface ProcessingOptions {
  forceReprocess?: boolean;
  documentType?: DocumentType;
  userId: string;
}

/**
 * Process a document with AI
 */
export async function processDocument(
  documentId: string,
  options: ProcessingOptions
): Promise<AIProcessingResults> {
  try {
    const { forceReprocess = false, documentType, userId } = options;
    
    // Get document
    const document = await getDocumentById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check if document has already been processed and we're not forcing reprocessing
    if (document.aiProcessingResults && !forceReprocess) {
      return document.aiProcessingResults;
    }
    
    // Update document status to processing
    await updateDocument(documentId, {
      status: DocumentStatus.PROCESSING,
    });
    
    // Get file from storage
    const fileBuffer = await getFileFromStorage(document.filePath);
    
    // Process document
    const processingResult = documentType
      ? await documentProcessor.processDocumentWithType(fileBuffer, documentType)
      : await documentProcessor.processDocument(fileBuffer);
    
    // Map processing result to AI processing results
    const aiResults: AIProcessingResults = {
      documentType: processingResult.classification.documentType,
      confidence: processingResult.classification.confidence,
      extractedData: processingResult.extractedData.fields,
      dataConfidence: processingResult.extractedData.confidence,
      validationResult: processingResult.validation,
      processingTime: processingResult.processingTime,
      rawOcrText: processingResult.ocrResult.text,
    };
    
    // Update document with processing results
    const updatedDocument = await updateDocument(documentId, {
      status: processingResult.validation.isValid
        ? DocumentStatus.VALIDATED
        : DocumentStatus.REJECTED,
      processedAt: new Date(),
      extractedData: processingResult.extractedData.fields,
      aiProcessingResults: aiResults,
    });
    
    // Create notification
    const notificationType = processingResult.validation.isValid
      ? NotificationType.DOCUMENT_VALIDATED
      : NotificationType.DOCUMENT_REJECTED;
    
    const notificationTitle = processingResult.validation.isValid
      ? 'Document Validated'
      : 'Document Validation Failed';
    
    const notificationMessage = processingResult.validation.isValid
      ? `Your ${processingResult.classification.documentType} has been validated successfully.`
      : `Your ${processingResult.classification.documentType} validation failed. Please check the issues and upload a new document.`;
    
    await createNotification({
      userId: document.uploadedBy,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      entityId: documentId,
      entityType: 'document',
      link: `/documents/${documentId}`,
      metadata: {
        documentType: processingResult.classification.documentType,
        validationScore: processingResult.validation.score,
        errors: processingResult.validation.errors,
        warnings: processingResult.validation.warnings,
      },
    });
    
    return aiResults;
  } catch (error) {
    console.error('Error processing document:', error);
    
    // Update document status to pending if there was an error
    await updateDocument(documentId, {
      status: DocumentStatus.PENDING,
    });
    
    throw error;
  }
}

/**
 * Reprocess a document with a different type
 */
export async function reprocessDocumentWithType(
  documentId: string,
  documentType: DocumentType,
  userId: string
): Promise<AIProcessingResults> {
  return processDocument(documentId, {
    forceReprocess: true,
    documentType,
    userId,
  });
}
