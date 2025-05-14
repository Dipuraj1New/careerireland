/**
 * Form Generation Service
 * 
 * Generates PDF forms based on templates and form data.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { 
  FormTemplate, 
  FormTemplateStatus, 
  FormSubmission,
  FormSubmissionStatus,
  FormSection,
  FormField,
  FormFieldType,
  FormSubmissionCreateData
} from '@/types/form';
import { DocumentType } from '@/types/document';
import * as formTemplateService from './formTemplateService';
import * as formSubmissionRepository from './formSubmissionRepository';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import { uploadFile } from '@/services/storage/storageService';

/**
 * Generate a form based on template and form data
 */
export async function generateForm(
  templateId: string,
  formData: Record<string, any>,
  caseId: string,
  userId: string
): Promise<{ 
  success: boolean; 
  submission?: FormSubmission; 
  message?: string; 
  missingFields?: string[];
}> {
  try {
    // Get template
    const template = await formTemplateService.getFormTemplateById(templateId);
    
    if (!template) {
      return {
        success: false,
        message: `Template with ID ${templateId} not found`,
      };
    }
    
    // Check if template is active
    if (template.status !== FormTemplateStatus.ACTIVE) {
      return {
        success: false,
        message: `Template with ID ${templateId} is not active`,
      };
    }
    
    // Check for missing required fields
    const missingFields = template.requiredFields.filter(
      field => !formData[field]
    );
    
    if (missingFields.length > 0) {
      return {
        success: false,
        message: 'Missing required fields',
        missingFields,
      };
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDF(template, formData);
    
    // Upload PDF to storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${template.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.pdf`;
    const filePath = `forms/${caseId}/${fileName}`;
    
    const uploadResult = await uploadFile(
      pdfBuffer,
      filePath,
      'application/pdf',
      userId
    );
    
    if (!uploadResult.success) {
      return {
        success: false,
        message: 'Failed to upload generated form',
      };
    }
    
    // Create form submission record
    const submissionData: FormSubmissionCreateData = {
      templateId,
      caseId,
      formData,
      filePath: uploadResult.url,
      fileName,
      fileSize: pdfBuffer.length,
    };
    
    const submission = await formSubmissionRepository.createFormSubmission(
      submissionData,
      userId,
      template.version
    );
    
    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.FORM_SUBMISSION,
      entityId: submission.id,
      action: AuditAction.GENERATE,
      details: {
        templateId,
        templateName: template.name,
        templateVersion: template.version,
        caseId,
      },
    });
    
    return {
      success: true,
      submission,
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
 * Generate a PDF from a template and form data
 */
async function generatePDF(
  template: FormTemplate,
  formData: Record<string, any>
): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Set page size
  const pageSize = template.templateData.pageSize || 'A4';
  const orientation = template.templateData.orientation || 'portrait';
  
  let pageWidth = 595.28; // A4 width in points
  let pageHeight = 841.89; // A4 height in points
  
  if (pageSize === 'Letter') {
    pageWidth = 612;
    pageHeight = 792;
  } else if (pageSize === 'Legal') {
    pageWidth = 612;
    pageHeight = 1008;
  }
  
  // Swap dimensions for landscape orientation
  if (orientation === 'landscape') {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }
  
  // Add a page to the document
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Get the standard font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Set default styling
  const styling = template.templateData.styling || {};
  const fontSize = styling.fontSize || 12;
  const lineHeight = styling.lineHeight || 24;
  const primaryColor = styling.primaryColor ? hexToRgb(styling.primaryColor) : rgb(0, 0, 0);
  
  // Set margins
  const margins = template.templateData.margins || {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50,
  };
  
  // Add title
  page.drawText(template.templateData.title, {
    x: margins.left,
    y: pageHeight - margins.top,
    size: fontSize * 1.5,
    font: boldFont,
    color: primaryColor,
  });
  
  // Initialize y position for content
  let yPosition = pageHeight - margins.top - lineHeight * 2;
  
  // Draw sections
  for (const section of template.templateData.sections) {
    // Draw section title if present
    if (section.title) {
      yPosition -= lineHeight;
      page.drawText(section.title, {
        x: margins.left,
        y: yPosition,
        size: fontSize * 1.2,
        font: boldFont,
        color: primaryColor,
      });
      yPosition -= lineHeight;
    }
    
    // Draw section description if present
    if (section.description) {
      page.drawText(section.description, {
        x: margins.left,
        y: yPosition,
        size: fontSize,
        font: font,
        color: primaryColor,
      });
      yPosition -= lineHeight;
    }
    
    // Draw fields
    for (const field of section.fields) {
      // Check if we need a new page
      if (yPosition < margins.bottom + lineHeight * 2) {
        // Add a new page
        const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margins.top;
      }
      
      // Draw field label
      page.drawText(`${field.label}:`, {
        x: margins.left,
        y: yPosition,
        size: fontSize,
        font: boldFont,
        color: primaryColor,
      });
      
      // Get field value
      const value = formData[field.id] || '';
      
      // Draw field value
      page.drawText(value.toString(), {
        x: margins.left + 200,
        y: yPosition,
        size: fontSize,
        font: font,
        color: primaryColor,
      });
      
      // Move to next line
      yPosition -= lineHeight;
    }
    
    // Add space after section
    yPosition -= lineHeight;
  }
  
  // Add footer if present
  if (template.templateData.footer) {
    page.drawText(template.templateData.footer, {
      x: margins.left,
      y: margins.bottom,
      size: fontSize * 0.8,
      font: font,
      color: primaryColor,
    });
  }
  
  // Serialize the PDFDocument to bytes
  const pdfBytes = await pdfDoc.save();
  
  return Buffer.from(pdfBytes);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string) {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  return rgb(r, g, b);
}

/**
 * Submit a form
 */
export async function submitForm(
  submissionId: string,
  userId: string
): Promise<{ 
  success: boolean; 
  submission?: FormSubmission; 
  message?: string;
}> {
  try {
    // Get submission
    const submission = await formSubmissionRepository.getFormSubmissionById(submissionId);
    
    if (!submission) {
      return {
        success: false,
        message: `Submission with ID ${submissionId} not found`,
      };
    }
    
    // Check if submission is already submitted
    if (submission.status !== FormSubmissionStatus.GENERATED) {
      return {
        success: false,
        message: `Submission with ID ${submissionId} is already ${submission.status}`,
      };
    }
    
    // Update submission status
    const updatedSubmission = await formSubmissionRepository.updateFormSubmissionStatus(
      submissionId,
      FormSubmissionStatus.SUBMITTED
    );
    
    if (!updatedSubmission) {
      return {
        success: false,
        message: `Failed to update submission status`,
      };
    }
    
    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.FORM_SUBMISSION,
      entityId: submissionId,
      action: AuditAction.SUBMIT,
      details: {
        templateId: submission.templateId,
        caseId: submission.caseId,
      },
    });
    
    return {
      success: true,
      submission: updatedSubmission,
    };
  } catch (error) {
    console.error('Error submitting form:', error);
    return {
      success: false,
      message: `Form submission failed: ${error.message}`,
    };
  }
}

/**
 * Get form submissions by case ID
 */
export async function getFormSubmissionsByCaseId(caseId: string): Promise<FormSubmission[]> {
  return formSubmissionRepository.getFormSubmissionsByCaseId(caseId);
}

/**
 * Get form submission by ID
 */
export async function getFormSubmissionById(id: string): Promise<FormSubmission | null> {
  return formSubmissionRepository.getFormSubmissionById(id);
}

export default {
  generateForm,
  submitForm,
  getFormSubmissionsByCaseId,
  getFormSubmissionById,
};
