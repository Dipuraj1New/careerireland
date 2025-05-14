/**
 * Form Generation Service
 * 
 * Generates forms based on document type and extracted data.
 * Uses templates to create prefilled forms for immigration applications.
 */
import { DocumentType } from '@/types/document';
import { ExtractedData } from './dataExtractionService';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  documentTypes: DocumentType[];
  requiredFields: string[];
  optionalFields: string[];
  fieldMappings: Record<string, string>;
}

export interface FormGenerationResult {
  success: boolean;
  formBuffer?: Buffer;
  formUrl?: string;
  message?: string;
  missingFields?: string[];
}

export class FormGenerationService {
  // Form templates for different immigration forms
  private formTemplates: FormTemplate[] = [
    {
      id: 'gnib-1',
      name: 'GNIB Registration Form',
      description: 'Garda National Immigration Bureau Registration Form',
      documentTypes: [
        DocumentType.PASSPORT,
        DocumentType.VISA,
        DocumentType.RESIDENCE_PERMIT,
      ],
      requiredFields: [
        'surname',
        'givenNames',
        'dateOfBirth',
        'nationality',
        'passportNumber',
      ],
      optionalFields: [
        'gender',
        'placeOfBirth',
        'dateOfIssue',
        'dateOfExpiry',
      ],
      fieldMappings: {
        'surname': 'Surname',
        'givenNames': 'Given Names',
        'dateOfBirth': 'Date of Birth',
        'nationality': 'Nationality',
        'passportNumber': 'Passport Number',
        'gender': 'Gender',
        'placeOfBirth': 'Place of Birth',
        'dateOfIssue': 'Date of Issue',
        'dateOfExpiry': 'Date of Expiry',
      },
    },
    {
      id: 'inis-1',
      name: 'INIS Application Form',
      description: 'Irish Naturalisation and Immigration Service Application Form',
      documentTypes: [
        DocumentType.PASSPORT,
        DocumentType.VISA,
        DocumentType.RESIDENCE_PERMIT,
        DocumentType.EMPLOYMENT,
      ],
      requiredFields: [
        'surname',
        'givenNames',
        'dateOfBirth',
        'nationality',
        'passportNumber',
      ],
      optionalFields: [
        'gender',
        'placeOfBirth',
        'dateOfIssue',
        'dateOfExpiry',
        'employerName',
        'position',
      ],
      fieldMappings: {
        'surname': 'Surname',
        'givenNames': 'Given Names',
        'dateOfBirth': 'Date of Birth',
        'nationality': 'Nationality',
        'passportNumber': 'Passport Number',
        'gender': 'Gender',
        'placeOfBirth': 'Place of Birth',
        'dateOfIssue': 'Date of Issue',
        'dateOfExpiry': 'Date of Expiry',
        'employerName': 'Employer Name',
        'position': 'Position',
      },
    },
    {
      id: 'student-visa-1',
      name: 'Student Visa Application',
      description: 'Irish Student Visa Application Form',
      documentTypes: [
        DocumentType.PASSPORT,
        DocumentType.EDUCATIONAL,
        DocumentType.FINANCIAL,
        DocumentType.LANGUAGE_CERTIFICATE,
      ],
      requiredFields: [
        'surname',
        'givenNames',
        'dateOfBirth',
        'nationality',
        'passportNumber',
        'institutionName',
        'qualification',
      ],
      optionalFields: [
        'gender',
        'placeOfBirth',
        'dateOfIssue',
        'dateOfExpiry',
        'language',
        'overallScore',
        'accountHolder',
        'balance',
      ],
      fieldMappings: {
        'surname': 'Surname',
        'givenNames': 'Given Names',
        'dateOfBirth': 'Date of Birth',
        'nationality': 'Nationality',
        'passportNumber': 'Passport Number',
        'gender': 'Gender',
        'placeOfBirth': 'Place of Birth',
        'institutionName': 'Institution Name',
        'qualification': 'Course/Qualification',
        'language': 'Language Proficiency',
        'overallScore': 'Language Score',
        'accountHolder': 'Account Holder Name',
        'balance': 'Account Balance',
      },
    },
  ];
  
  /**
   * Get available form templates for a document type
   */
  getTemplatesForDocumentType(documentType: DocumentType): FormTemplate[] {
    return this.formTemplates.filter(template => 
      template.documentTypes.includes(documentType)
    );
  }
  
  /**
   * Generate a form based on template and extracted data
   */
  async generateForm(
    templateId: string,
    extractedData: Record<string, string | null>,
    additionalData?: Record<string, string>
  ): Promise<FormGenerationResult> {
    try {
      // Find the template
      const template = this.formTemplates.find(t => t.id === templateId);
      if (!template) {
        return {
          success: false,
          message: `Template with ID ${templateId} not found`,
        };
      }
      
      // Check for missing required fields
      const missingFields = template.requiredFields.filter(
        field => !extractedData[field] && (!additionalData || !additionalData[field])
      );
      
      if (missingFields.length > 0) {
        return {
          success: false,
          message: 'Missing required fields',
          missingFields,
        };
      }
      
      // Combine extracted data with additional data
      const combinedData = { ...extractedData };
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          combinedData[key] = value;
        });
      }
      
      // Generate PDF form
      const pdfBuffer = await this.generatePDF(template, combinedData);
      
      return {
        success: true,
        formBuffer: pdfBuffer,
        message: 'Form generated successfully',
      };
    } catch (error) {
      console.error('Error generating form:', error);
      return {
        success: false,
        message: `Form generation failed: ${error.message}`,
      };
    }
  }
  
  /**
   * Generate a PDF form
   */
  private async generatePDF(
    template: FormTemplate,
    data: Record<string, string | null>
  ): Promise<Buffer> {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page to the document
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    // Get the standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Set some styles
    const fontSize = 12;
    const lineHeight = 24;
    const margin = 50;
    
    // Add title
    page.drawText(template.name, {
      x: margin,
      y: page.getHeight() - margin,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Add description
    page.drawText(template.description, {
      x: margin,
      y: page.getHeight() - margin - 30,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Add form fields
    let yPosition = page.getHeight() - margin - 70;
    
    // Add all fields from the template
    const allFields = [...template.requiredFields, ...template.optionalFields];
    
    for (const field of allFields) {
      const label = template.fieldMappings[field] || field;
      const value = data[field] || '';
      
      // Draw field label
      page.drawText(`${label}:`, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Draw field value
      page.drawText(value, {
        x: margin + 200,
        y: yPosition,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      // Move to next line
      yPosition -= lineHeight;
      
      // Add a new page if we're running out of space
      if (yPosition < margin) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        yPosition = newPage.getHeight() - margin;
      }
    }
    
    // Add signature field
    yPosition -= lineHeight * 2;
    page.drawText('Signature:', {
      x: margin,
      y: yPosition,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw signature line
    page.drawLine({
      start: { x: margin + 100, y: yPosition },
      end: { x: page.getWidth() - margin, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // Add date field
    yPosition -= lineHeight * 2;
    page.drawText('Date:', {
      x: margin,
      y: yPosition,
      size: fontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw date line
    page.drawLine({
      start: { x: margin + 100, y: yPosition },
      end: { x: margin + 200, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();
    
    return Buffer.from(pdfBytes);
  }
}

export default new FormGenerationService();
