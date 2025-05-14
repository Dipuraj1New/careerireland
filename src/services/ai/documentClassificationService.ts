/**
 * Document Classification Service
 *
 * Handles document type classification using machine learning techniques.
 * Identifies document types such as passports, utility bills, bank statements, etc.
 */
import { DocumentType } from '@/types/document';
import ocrService, { OCRResult } from './ocrService';
import { OpenAI } from 'openai';
import config from '@/lib/config';

export interface ClassificationResult {
  documentType: DocumentType;
  confidence: number;
  alternativeTypes: Array<{
    documentType: DocumentType;
    confidence: number;
  }>;
}

export class DocumentClassifier {
  private openai: OpenAI | null = null;

  // Initialize OpenAI client
  private getOpenAIClient(): OpenAI {
    if (!this.openai) {
      const apiKey = config.openai?.apiKey;
      if (!apiKey) {
        throw new Error('OpenAI API key is not configured');
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  // Keywords associated with different document types
  private documentTypeKeywords: Record<DocumentType, string[]> = {
    [DocumentType.PASSPORT]: [
      'passport', 'nationality', 'surname', 'given names', 'date of birth',
      'place of birth', 'date of issue', 'date of expiry', 'authority',
      'document no', 'personal no', 'type', 'code', 'sex', 'height', 'color of eyes'
    ],
    [DocumentType.VISA]: [
      'visa', 'valid for', 'number of entries', 'duration of stay',
      'issued at', 'valid from', 'valid until', 'remarks', 'type', 'consulate'
    ],
    [DocumentType.RESIDENCE_PERMIT]: [
      'residence permit', 'residence card', 'permit no', 'residence',
      'permission to reside', 'permission to remain', 'gnib', 'inis', 'immigration'
    ],
    [DocumentType.BIRTH_CERTIFICATE]: [
      'birth certificate', 'certificate of birth', 'born on', 'child',
      'father', 'mother', 'parents', 'registrar', 'registration district'
    ],
    [DocumentType.MARRIAGE_CERTIFICATE]: [
      'marriage certificate', 'certificate of marriage', 'married on',
      'bride', 'groom', 'spouse', 'witnesses', 'solemnized', 'officiant'
    ],
    [DocumentType.FINANCIAL]: [
      'bank statement', 'account', 'balance', 'transaction', 'deposit',
      'withdrawal', 'credit', 'debit', 'statement period', 'opening balance',
      'closing balance', 'sort code', 'account number', 'iban', 'bic'
    ],
    [DocumentType.EMPLOYMENT]: [
      'employment contract', 'employer', 'employee', 'salary', 'wage',
      'position', 'job title', 'start date', 'working hours', 'probation',
      'termination', 'notice period', 'employment letter', 'job offer'
    ],
    [DocumentType.EDUCATION]: [
      'diploma', 'certificate', 'degree', 'transcript', 'university',
      'college', 'school', 'academic', 'qualification', 'graduate',
      'bachelor', 'master', 'phd', 'doctorate', 'education'
    ],
    [DocumentType.UTILITY_BILL]: [
      'bill', 'utility', 'electricity', 'gas', 'water', 'internet',
      'broadband', 'telephone', 'invoice', 'account number', 'customer',
      'payment', 'due date', 'meter reading', 'consumption', 'period'
    ],
    [DocumentType.MEDICAL]: [
      'medical', 'health', 'doctor', 'hospital', 'clinic', 'patient',
      'diagnosis', 'treatment', 'prescription', 'medication', 'insurance',
      'healthcare', 'examination', 'test results', 'referral'
    ],
    [DocumentType.OTHER]: [] // No specific keywords for OTHER type
  };

  /**
   * Classify a document based on OCR text using keyword matching
   * This is the original method that uses keyword matching
   */
  async classifyFromTextWithKeywords(ocrResult: OCRResult): Promise<ClassificationResult> {
    try {
      const text = ocrResult.text.toLowerCase();

      // Calculate scores for each document type
      const scores: Record<DocumentType, number> = {} as Record<DocumentType, number>;

      for (const [docType, keywords] of Object.entries(this.documentTypeKeywords)) {
        // Skip OTHER type in scoring
        if (docType === DocumentType.OTHER) continue;

        // Count keyword matches
        let matchCount = 0;
        for (const keyword of keywords) {
          if (text.includes(keyword.toLowerCase())) {
            matchCount++;
          }
        }

        // Calculate score as percentage of matched keywords
        scores[docType as DocumentType] = keywords.length > 0
          ? (matchCount / keywords.length) * 100
          : 0;
      }

      // Find the document type with the highest score
      let bestType = DocumentType.OTHER;
      let bestScore = 0;

      for (const [docType, score] of Object.entries(scores)) {
        if (score > bestScore) {
          bestScore = score;
          bestType = docType as DocumentType;
        }
      }

      // If best score is below threshold, classify as OTHER
      const confidenceThreshold = 30; // 30% confidence threshold
      if (bestScore < confidenceThreshold) {
        bestType = DocumentType.OTHER;
        bestScore = 100 - bestScore; // Invert score for OTHER type
      }

      // Get alternative types (next highest scores)
      const alternatives = Object.entries(scores)
        .filter(([docType]) => docType !== bestType)
        .map(([docType, score]) => ({
          documentType: docType as DocumentType,
          confidence: score,
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3); // Top 3 alternatives

      return {
        documentType: bestType,
        confidence: bestScore,
        alternativeTypes: alternatives,
      };
    } catch (error) {
      console.error('Error classifying document with keywords:', error);
      throw new Error('Document classification with keywords failed');
    }
  }

  /**
   * Classify a document based on OCR text using AI
   * This method uses OpenAI's GPT model for more accurate classification
   */
  async classifyFromTextWithAI(ocrResult: OCRResult): Promise<ClassificationResult> {
    try {
      const text = ocrResult.text;

      // If text is too short, fall back to keyword matching
      if (text.length < 50) {
        return this.classifyFromTextWithKeywords(ocrResult);
      }

      // Get OpenAI client
      const openai = this.getOpenAIClient();

      // Create a prompt that describes the task and document types
      const documentTypes = Object.values(DocumentType);
      const prompt = `
        Analyze the following document text and classify it into one of these categories:
        ${documentTypes.join(', ')}

        For each category, provide a confidence score from 0-100.

        Document text:
        ${text.substring(0, 1000)} // Limit text length to avoid token limits

        Respond in JSON format with:
        {
          "bestMatch": "DOCUMENT_TYPE",
          "confidence": 85,
          "alternatives": [
            {"type": "DOCUMENT_TYPE", "confidence": 40},
            {"type": "DOCUMENT_TYPE", "confidence": 20}
          ]
        }
      `;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use a suitable model
        messages: [
          { role: 'system', content: 'You are a document classification expert. Analyze document text and classify it accurately.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more deterministic results
        response_format: { type: 'json_object' }
      });

      // Parse the response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI classifier');
      }

      const result = JSON.parse(content);

      // Validate the result
      if (!result.bestMatch || typeof result.confidence !== 'number') {
        throw new Error('Invalid AI classification result format');
      }

      // Map the result to our ClassificationResult format
      const documentType = result.bestMatch as DocumentType;
      const confidence = Math.min(Math.max(result.confidence, 0), 100); // Ensure confidence is between 0-100

      const alternativeTypes = (result.alternatives || [])
        .filter((alt: any) => alt.type && typeof alt.confidence === 'number')
        .map((alt: any) => ({
          documentType: alt.type as DocumentType,
          confidence: Math.min(Math.max(alt.confidence, 0), 100),
        }))
        .slice(0, 3); // Top 3 alternatives

      return {
        documentType,
        confidence,
        alternativeTypes,
      };
    } catch (error) {
      console.error('Error classifying document with AI:', error);
      // Fall back to keyword-based classification if AI fails
      return this.classifyFromTextWithKeywords(ocrResult);
    }
  }

  /**
   * Classify a document based on OCR text
   * This method tries AI classification first and falls back to keyword matching if needed
   */
  async classifyFromText(ocrResult: OCRResult): Promise<ClassificationResult> {
    try {
      // Check if OpenAI API key is configured
      const hasOpenAI = !!config.openai?.apiKey;

      if (hasOpenAI) {
        // Try AI-based classification first
        return await this.classifyFromTextWithAI(ocrResult);
      } else {
        // Fall back to keyword-based classification
        return await this.classifyFromTextWithKeywords(ocrResult);
      }
    } catch (error) {
      console.error('Error classifying document:', error);
      // Final fallback to keyword-based classification
      return this.classifyFromTextWithKeywords(ocrResult);
    }
  }

  /**
   * Classify a document from an image buffer
   */
  async classifyFromImage(imageBuffer: Buffer): Promise<ClassificationResult> {
    try {
      // Extract text from the image
      const ocrResult = await ocrService.extractText(imageBuffer);

      // Classify based on the extracted text
      return this.classifyFromText(ocrResult);
    } catch (error) {
      console.error('Error classifying document from image:', error);
      throw error;
    }
  }
}

export default new DocumentClassifier();
