import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import documentProcessor from '@/services/ai/documentProcessingService';
import ocrService from '@/services/ai/ocrService';
import documentClassifier from '@/services/ai/documentClassificationService';
import dataExtractor from '@/services/ai/dataExtractionService';
import documentValidator from '@/services/ai/documentValidationService';
import { DocumentType } from '@/types/document';

// Mock the dependencies
jest.mock('@/services/ai/ocrService', () => ({
  extractText: jest.fn(),
}));

jest.mock('@/services/ai/documentClassificationService', () => ({
  classifyFromText: jest.fn(),
}));

jest.mock('@/services/ai/dataExtractionService', () => ({
  extractData: jest.fn(),
}));

jest.mock('@/services/ai/documentValidationService', () => ({
  validate: jest.fn(),
}));

describe('Document Processing Service', () => {
  const mockImageBuffer = Buffer.from('mock-image-data');
  
  // Mock OCR result
  const mockOcrResult = {
    text: 'Sample passport data\nName: John Doe\nPassport Number: AB123456\nDate of Birth: 01/01/1980',
    confidence: 95,
    words: [
      { text: 'Sample', confidence: 98, bbox: { x0: 0, y0: 0, x1: 10, y1: 10 } },
      { text: 'passport', confidence: 97, bbox: { x0: 11, y0: 0, x1: 20, y1: 10 } },
      // ... more words
    ],
    lines: [
      { text: 'Sample passport data', confidence: 96, bbox: { x0: 0, y0: 0, x1: 100, y1: 10 } },
      // ... more lines
    ],
  };
  
  // Mock classification result
  const mockClassificationResult = {
    documentType: DocumentType.PASSPORT,
    confidence: 90,
    alternativeTypes: [
      { documentType: DocumentType.IDENTIFICATION, confidence: 60 },
      { documentType: DocumentType.TRAVEL, confidence: 40 },
    ],
  };
  
  // Mock extracted data
  const mockExtractedData = {
    fields: {
      passportNumber: 'AB123456',
      name: 'John Doe',
      dateOfBirth: '1980-01-01',
    },
    confidence: {
      passportNumber: 95,
      name: 90,
      dateOfBirth: 85,
    },
  };
  
  // Mock validation result
  const mockValidationResult = {
    isValid: true,
    score: 85,
    errors: [],
    warnings: [
      { field: 'dateOfBirth', message: 'Low confidence for date of birth' },
    ],
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock implementations
    (ocrService.extractText as jest.Mock).mockResolvedValue(mockOcrResult);
    (documentClassifier.classifyFromText as jest.Mock).mockResolvedValue(mockClassificationResult);
    (dataExtractor.extractData as jest.Mock).mockResolvedValue(mockExtractedData);
    (documentValidator.validate as jest.Mock).mockReturnValue(mockValidationResult);
  });
  
  describe('processDocument', () => {
    it('should process a document and return the expected result', async () => {
      // Act
      const result = await documentProcessor.processDocument(mockImageBuffer);
      
      // Assert
      expect(ocrService.extractText).toHaveBeenCalledWith(mockImageBuffer);
      expect(documentClassifier.classifyFromText).toHaveBeenCalledWith(mockOcrResult);
      expect(dataExtractor.extractData).toHaveBeenCalledWith(
        mockOcrResult,
        DocumentType.PASSPORT
      );
      expect(documentValidator.validate).toHaveBeenCalledWith(
        mockExtractedData,
        DocumentType.PASSPORT
      );
      
      expect(result).toEqual({
        ocrResult: mockOcrResult,
        classification: mockClassificationResult,
        extractedData: mockExtractedData,
        validation: mockValidationResult,
        processingTime: expect.any(Number),
      });
    });
    
    it('should handle errors during processing', async () => {
      // Arrange
      (ocrService.extractText as jest.Mock).mockRejectedValue(new Error('OCR failed'));
      
      // Act & Assert
      await expect(documentProcessor.processDocument(mockImageBuffer)).rejects.toThrow('OCR failed');
    });
  });
  
  describe('processDocumentWithType', () => {
    it('should process a document with a known type', async () => {
      // Act
      const result = await documentProcessor.processDocumentWithType(
        mockImageBuffer,
        DocumentType.VISA
      );
      
      // Assert
      expect(ocrService.extractText).toHaveBeenCalledWith(mockImageBuffer);
      expect(documentClassifier.classifyFromText).not.toHaveBeenCalled();
      expect(dataExtractor.extractData).toHaveBeenCalledWith(
        mockOcrResult,
        DocumentType.VISA
      );
      expect(documentValidator.validate).toHaveBeenCalledWith(
        mockExtractedData,
        DocumentType.VISA
      );
      
      expect(result.classification).toEqual({
        documentType: DocumentType.VISA,
        confidence: 100,
        alternativeTypes: [],
      });
    });
  });
  
  describe('reprocessWithType', () => {
    it('should reprocess a document with a different type', async () => {
      // Act
      const result = await documentProcessor.reprocessWithType(
        mockOcrResult,
        DocumentType.RESIDENCE_PERMIT
      );
      
      // Assert
      expect(ocrService.extractText).not.toHaveBeenCalled();
      expect(documentClassifier.classifyFromText).not.toHaveBeenCalled();
      expect(dataExtractor.extractData).toHaveBeenCalledWith(
        mockOcrResult,
        DocumentType.RESIDENCE_PERMIT
      );
      expect(documentValidator.validate).toHaveBeenCalledWith(
        mockExtractedData,
        DocumentType.RESIDENCE_PERMIT
      );
      
      expect(result.classification).toEqual({
        documentType: DocumentType.RESIDENCE_PERMIT,
        confidence: 100,
        alternativeTypes: [],
      });
    });
  });
});
