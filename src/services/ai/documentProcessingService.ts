/**
 * Document Processing Service
 * 
 * Main service for AI document processing.
 * Combines OCR, classification, data extraction, and validation.
 */
import { DocumentType } from '@/types/document';
import ocrService, { OCRResult } from './ocrService';
import documentClassifier, { ClassificationResult } from './documentClassificationService';
import dataExtractor, { ExtractedData } from './dataExtractionService';
import documentValidator, { ValidationResult } from './documentValidationService';

export interface ProcessingResult {
  ocrResult: OCRResult;
  classification: ClassificationResult;
  extractedData: ExtractedData;
  validation: ValidationResult;
  processingTime: number;
}

export class DocumentProcessor {
  /**
   * Process a document image
   */
  async processDocument(imageBuffer: Buffer): Promise<ProcessingResult> {
    try {
      const startTime = Date.now();
      
      // Step 1: Extract text using OCR
      const ocrResult = await ocrService.extractText(imageBuffer);
      
      // Step 2: Classify the document
      const classification = await documentClassifier.classifyFromText(ocrResult);
      
      // Step 3: Extract data based on document type
      const extractedData = await dataExtractor.extractData(
        ocrResult,
        classification.documentType
      );
      
      // Step 4: Validate the extracted data
      const validation = documentValidator.validate(
        extractedData,
        classification.documentType
      );
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      return {
        ocrResult,
        classification,
        extractedData,
        validation,
        processingTime,
      };
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }
  
  /**
   * Process a document with a known type
   */
  async processDocumentWithType(
    imageBuffer: Buffer,
    documentType: DocumentType
  ): Promise<ProcessingResult> {
    try {
      const startTime = Date.now();
      
      // Step 1: Extract text using OCR
      const ocrResult = await ocrService.extractText(imageBuffer);
      
      // Step 2: Create a classification result with the known type
      const classification: ClassificationResult = {
        documentType,
        confidence: 100, // We're certain of the type
        alternativeTypes: [],
      };
      
      // Step 3: Extract data based on document type
      const extractedData = await dataExtractor.extractData(
        ocrResult,
        documentType
      );
      
      // Step 4: Validate the extracted data
      const validation = documentValidator.validate(
        extractedData,
        documentType
      );
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      return {
        ocrResult,
        classification,
        extractedData,
        validation,
        processingTime,
      };
    } catch (error) {
      console.error('Error processing document with known type:', error);
      throw error;
    }
  }
  
  /**
   * Reprocess a document with a different type
   */
  async reprocessWithType(
    ocrResult: OCRResult,
    documentType: DocumentType
  ): Promise<ProcessingResult> {
    try {
      const startTime = Date.now();
      
      // Step 1: Create a classification result with the new type
      const classification: ClassificationResult = {
        documentType,
        confidence: 100, // We're certain of the type
        alternativeTypes: [],
      };
      
      // Step 2: Extract data based on document type
      const extractedData = await dataExtractor.extractData(
        ocrResult,
        documentType
      );
      
      // Step 3: Validate the extracted data
      const validation = documentValidator.validate(
        extractedData,
        documentType
      );
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      return {
        ocrResult,
        classification,
        extractedData,
        validation,
        processingTime,
      };
    } catch (error) {
      console.error('Error reprocessing document with new type:', error);
      throw error;
    }
  }
}

export default new DocumentProcessor();
