import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import ocrService, { OCRService } from '@/services/ai/ocrService';
import { ImagePreprocessor } from '@/services/ai/imagePreprocessingService';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import config from '@/lib/config';

// Mock dependencies
jest.mock('@/services/ai/imagePreprocessingService', () => ({
  ImagePreprocessor: jest.fn().mockImplementation(() => ({
    preprocess: jest.fn().mockResolvedValue(Buffer.from('preprocessed-image')),
  })),
}));

jest.mock('@google-cloud/vision', () => ({
  ImageAnnotatorClient: jest.fn().mockImplementation(() => ({
    textDetection: jest.fn().mockResolvedValue([
      {
        textAnnotations: [
          {
            description: 'Sample text from Google Vision API',
            boundingPoly: {
              vertices: [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 50 },
                { x: 0, y: 50 },
              ],
            },
          },
          {
            description: 'Sample',
            boundingPoly: {
              vertices: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
                { x: 50, y: 20 },
                { x: 0, y: 20 },
              ],
            },
          },
          {
            description: 'text',
            boundingPoly: {
              vertices: [
                { x: 55, y: 0 },
                { x: 80, y: 0 },
                { x: 80, y: 20 },
                { x: 55, y: 20 },
              ],
            },
          },
        ],
      },
    ]),
  })),
}));

jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockImplementation(() => ({
    recognize: jest.fn().mockResolvedValue({
      data: {
        text: 'Sample text from Tesseract',
        confidence: 95,
        words: [
          {
            text: 'Sample',
            confidence: 98,
            bbox: { x0: 0, y0: 0, x1: 50, y1: 20 },
          },
          {
            text: 'text',
            confidence: 97,
            bbox: { x0: 55, y0: 0, x1: 80, y1: 20 },
          },
          {
            text: 'from',
            confidence: 96,
            bbox: { x0: 85, y0: 0, x1: 110, y1: 20 },
          },
          {
            text: 'Tesseract',
            confidence: 94,
            bbox: { x0: 115, y0: 0, x1: 170, y1: 20 },
          },
        ],
        lines: [
          {
            text: 'Sample text from Tesseract',
            confidence: 95,
            bbox: { x0: 0, y0: 0, x1: 170, y1: 20 },
          },
        ],
      },
    }),
    terminate: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock config
jest.mock('@/lib/config', () => ({
  ai: {
    ocrProvider: 'tesseract',
    googleVision: {
      keyFilename: undefined,
      credentials: undefined,
    },
  },
}));

describe('OCR Service', () => {
  const mockImageBuffer = Buffer.from('mock-image-data');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Reset the config mock
    (config.ai as any).ocrProvider = 'tesseract';
  });
  
  describe('extractTextWithTesseract', () => {
    it('should extract text using Tesseract.js', async () => {
      // Act
      const result = await ocrService.extractTextWithTesseract(mockImageBuffer);
      
      // Assert
      expect(result).toEqual({
        text: 'Sample text from Tesseract',
        confidence: 95,
        words: expect.arrayContaining([
          expect.objectContaining({
            text: 'Sample',
            confidence: 98,
          }),
        ]),
        lines: expect.arrayContaining([
          expect.objectContaining({
            text: 'Sample text from Tesseract',
            confidence: 95,
          }),
        ]),
      });
    });
    
    it('should handle errors from Tesseract.js', async () => {
      // Arrange
      const createWorker = require('tesseract.js').createWorker;
      createWorker.mockImplementationOnce(() => ({
        recognize: jest.fn().mockRejectedValue(new Error('Tesseract error')),
        terminate: jest.fn().mockResolvedValue(undefined),
      }));
      
      // Act & Assert
      await expect(ocrService.extractTextWithTesseract(mockImageBuffer))
        .rejects.toThrow('OCR processing failed');
    });
  });
  
  describe('extractTextWithGoogleVision', () => {
    it('should extract text using Google Vision API', async () => {
      // Act
      const result = await ocrService.extractTextWithGoogleVision(mockImageBuffer);
      
      // Assert
      expect(result).toEqual({
        text: 'Sample text from Google Vision API',
        confidence: expect.any(Number),
        words: expect.arrayContaining([
          expect.objectContaining({
            text: 'Sample',
            confidence: expect.any(Number),
          }),
        ]),
        lines: expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining('Sample text'),
            confidence: expect.any(Number),
          }),
        ]),
      });
    });
    
    it('should handle errors from Google Vision API', async () => {
      // Arrange
      const ImageAnnotatorClient = require('@google-cloud/vision').ImageAnnotatorClient;
      ImageAnnotatorClient.mockImplementationOnce(() => ({
        textDetection: jest.fn().mockRejectedValue(new Error('Google Vision error')),
      }));
      
      // Act & Assert
      await expect(ocrService.extractTextWithGoogleVision(mockImageBuffer))
        .rejects.toThrow('Google Vision OCR failed: Google Vision error');
    });
    
    it('should use credentials from config if provided', async () => {
      // Arrange
      (config.ai.googleVision as any).keyFilename = 'path/to/key.json';
      
      // Act
      await ocrService.extractTextWithGoogleVision(mockImageBuffer);
      
      // Assert
      const ImageAnnotatorClient = require('@google-cloud/vision').ImageAnnotatorClient;
      expect(ImageAnnotatorClient).toHaveBeenCalledWith({ keyFilename: 'path/to/key.json' });
    });
  });
  
  describe('extractText', () => {
    it('should use Tesseract by default', async () => {
      // Act
      await ocrService.extractText(mockImageBuffer);
      
      // Assert
      const createWorker = require('tesseract.js').createWorker;
      expect(createWorker).toHaveBeenCalled();
    });
    
    it('should use Google Vision if configured', async () => {
      // Arrange
      (config.ai as any).ocrProvider = 'google-vision';
      
      // Act
      await ocrService.extractText(mockImageBuffer);
      
      // Assert
      const ImageAnnotatorClient = require('@google-cloud/vision').ImageAnnotatorClient;
      expect(ImageAnnotatorClient).toHaveBeenCalled();
    });
    
    it('should fall back to Tesseract if Google Vision fails', async () => {
      // Arrange
      (config.ai as any).ocrProvider = 'google-vision';
      const ImageAnnotatorClient = require('@google-cloud/vision').ImageAnnotatorClient;
      ImageAnnotatorClient.mockImplementationOnce(() => ({
        textDetection: jest.fn().mockRejectedValue(new Error('Google Vision error')),
      }));
      
      // Act
      const result = await ocrService.extractText(mockImageBuffer);
      
      // Assert
      const createWorker = require('tesseract.js').createWorker;
      expect(createWorker).toHaveBeenCalled();
      expect(result.text).toBe('Sample text from Tesseract');
    });
  });
});
