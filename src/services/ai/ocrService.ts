/**
 * OCR Service
 *
 * Handles text extraction from document images using OCR technology.
 * Integrates with Tesseract.js for local processing or Google Vision API for cloud processing.
 */
import { createWorker } from 'tesseract.js';
import config from '@/lib/config';
import { ImagePreprocessor } from './imagePreprocessingService';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { promises as fs } from 'fs';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  lines: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export class OCRService {
  private preprocessor: ImagePreprocessor;

  constructor() {
    this.preprocessor = new ImagePreprocessor();
  }

  /**
   * Extract text from an image using Tesseract.js
   */
  async extractTextWithTesseract(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      // Preprocess the image for better OCR results
      const processedImageBuffer = await this.preprocessor.preprocess(imageBuffer);

      // Create a worker
      const worker = await createWorker('eng');

      // Recognize text
      const { data } = await worker.recognize(processedImageBuffer);

      // Terminate the worker
      await worker.terminate();

      // Map Tesseract result to our OCRResult interface
      const result: OCRResult = {
        text: data.text,
        confidence: data.confidence,
        words: data.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: {
            x0: word.bbox.x0,
            y0: word.bbox.y0,
            x1: word.bbox.x1,
            y1: word.bbox.y1,
          },
        })),
        lines: data.lines.map(line => ({
          text: line.text,
          confidence: line.confidence,
          bbox: {
            x0: line.bbox.x0,
            y0: line.bbox.y0,
            x1: line.bbox.x1,
            y1: line.bbox.y1,
          },
        })),
      };

      return result;
    } catch (error) {
      console.error('Error extracting text with Tesseract:', error);
      throw new Error('OCR processing failed');
    }
  }

  /**
   * Extract text from an image using Google Vision API
   * Requires setting up Google Cloud credentials via environment variables
   * or a service account key file
   */
  async extractTextWithGoogleVision(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      // Preprocess the image for better OCR results
      const processedImageBuffer = await this.preprocessor.preprocess(imageBuffer);

      // Initialize the Google Vision client with credentials from config
      let clientOptions = {};

      if (config.ai?.googleVision?.keyFilename) {
        clientOptions = { keyFilename: config.ai.googleVision.keyFilename };
      } else if (config.ai?.googleVision?.credentials) {
        try {
          const credentials = JSON.parse(config.ai.googleVision.credentials);
          clientOptions = { credentials };
        } catch (error) {
          console.error('Error parsing Google Vision credentials:', error);
        }
      }

      const client = new ImageAnnotatorClient(clientOptions);

      // Call the text detection API
      const [result] = await client.textDetection(processedImageBuffer);
      const detections = result.textAnnotations || [];

      if (!detections.length) {
        return {
          text: '',
          confidence: 0,
          words: [],
          lines: [],
        };
      }

      // The first annotation contains the entire text
      const fullTextAnnotation = detections[0];

      // Extract words from the remaining annotations (index 1 and beyond)
      const words = detections.slice(1).map(word => {
        // Calculate confidence (Google Vision doesn't provide per-word confidence)
        // We'll use a default high value since these are detected words
        const confidence = 90;

        // Extract bounding box vertices
        const vertices = word.boundingPoly?.vertices || [];
        const bbox = vertices.length === 4 ? {
          x0: vertices[0].x || 0,
          y0: vertices[0].y || 0,
          x1: vertices[2].x || 0,
          y1: vertices[2].y || 0,
        } : { x0: 0, y0: 0, x1: 0, y1: 0 };

        return {
          text: word.description || '',
          confidence,
          bbox,
        };
      });

      // Group words into lines (simplified approach)
      // This is a basic implementation - in a production system, you'd use
      // more sophisticated line detection based on y-coordinates
      const lineMap = new Map<number, Array<typeof words[0]>>();

      words.forEach(word => {
        // Use the y-coordinate of the top of the bounding box as the line key
        // Round to the nearest 10 pixels to group words on approximately the same line
        const lineKey = Math.round(word.bbox.y0 / 10) * 10;

        if (!lineMap.has(lineKey)) {
          lineMap.set(lineKey, []);
        }

        lineMap.get(lineKey)?.push(word);
      });

      // Sort words in each line by x-coordinate and create line objects
      const lines = Array.from(lineMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([_, lineWords]) => {
          // Sort words by x-coordinate
          const sortedWords = lineWords.sort((a, b) => a.bbox.x0 - b.bbox.x0);

          // Combine words into a line
          const lineText = sortedWords.map(w => w.text).join(' ');

          // Calculate average confidence for the line
          const avgConfidence = sortedWords.reduce((sum, w) => sum + w.confidence, 0) / sortedWords.length;

          // Calculate line bounding box
          const x0 = Math.min(...sortedWords.map(w => w.bbox.x0));
          const y0 = Math.min(...sortedWords.map(w => w.bbox.y0));
          const x1 = Math.max(...sortedWords.map(w => w.bbox.x1));
          const y1 = Math.max(...sortedWords.map(w => w.bbox.y1));

          return {
            text: lineText,
            confidence: avgConfidence,
            bbox: { x0, y0, x1, y1 },
          };
        });

      // Calculate overall confidence as average of line confidences
      const overallConfidence = lines.length > 0
        ? lines.reduce((sum, line) => sum + line.confidence, 0) / lines.length
        : 0;

      return {
        text: fullTextAnnotation.description || '',
        confidence: overallConfidence,
        words,
        lines,
      };
    } catch (error) {
      console.error('Error extracting text with Google Vision:', error);
      throw new Error(`Google Vision OCR failed: ${error.message}`);
    }
  }

  /**
   * Extract text from an image using the preferred OCR provider
   */
  async extractText(imageBuffer: Buffer): Promise<OCRResult> {
    // Use the configured OCR provider
    const ocrProvider = config.ai?.ocrProvider || 'tesseract';

    try {
      if (ocrProvider === 'google-vision') {
        return await this.extractTextWithGoogleVision(imageBuffer);
      } else {
        return await this.extractTextWithTesseract(imageBuffer);
      }
    } catch (error) {
      console.error(`Error with OCR provider ${ocrProvider}:`, error);

      // If the preferred provider fails, try the fallback
      if (ocrProvider === 'google-vision') {
        console.log('Falling back to Tesseract OCR');
        return await this.extractTextWithTesseract(imageBuffer);
      } else if (ocrProvider === 'tesseract') {
        // If we're already using Tesseract and it failed, just throw the error
        throw error;
      }

      // This should never happen, but TypeScript needs it
      throw error;
    }
  }

  /**
   * Extract text from a PDF document
   * Uses pdf-parse for text extraction and falls back to OCR if needed
   */
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<OCRResult[]> {
    try {
      // Import pdf-parse dynamically to avoid server-side issues
      const pdfParse = (await import('pdf-parse')).default;

      // First try to extract text directly from the PDF
      const pdfData = await pdfParse(pdfBuffer);

      // If we got text, return it as a single OCRResult
      if (pdfData.text && pdfData.text.trim().length > 0) {
        return [{
          text: pdfData.text,
          confidence: 95, // High confidence for direct extraction
          words: [], // We don't have word-level data from pdf-parse
          lines: [], // We don't have line-level data from pdf-parse
        }];
      }

      // If no text was extracted, the PDF might be scanned images
      // In this case, we need to convert pages to images and use OCR

      // Import pdf.js dynamically
      const pdfjsLib = await import('pdfjs-dist');

      // Set the worker source - handle this differently in browser vs Node.js
      if (typeof window !== 'undefined') {
        // Browser environment
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
      } else {
        // Node.js environment - use a mock worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      }

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
      const pdfDocument = await loadingTask.promise;

      const numPages = pdfDocument.numPages;
      const results: OCRResult[] = [];

      // Process each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        // Get the page
        const page = await pdfDocument.getPage(pageNum);

        // Set viewport for rendering
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality

        // Create a canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the page to the canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert canvas to image buffer
        const imageData = canvas.toDataURL('image/png');
        const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Process the image with OCR
        const ocrResult = await this.extractText(imageBuffer);
        results.push(ocrResult);
      }

      return results;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);

      // If pdf.js fails (which can happen in Node.js environment),
      // we'll use a simpler approach with pdf-parse only
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(pdfBuffer);

        return [{
          text: pdfData.text || '',
          confidence: 90,
          words: [],
          lines: [],
        }];
      } catch (fallbackError) {
        console.error('PDF extraction fallback also failed:', fallbackError);
        throw new Error('PDF text extraction failed');
      }
    }
  }
}

export default new OCRService();
