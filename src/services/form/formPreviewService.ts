/**
 * Form Preview Service
 * 
 * Generates temporary PDF previews for forms without saving them.
 */
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { FormTemplate, FormSection, FormField, FormFieldType } from '@/types/form';
import { uploadFile } from '@/services/storage/storageService';

/**
 * Generate a PDF preview from a template and form data
 */
export async function generatePDFPreview(
  template: FormTemplate,
  formData: Record<string, any>
): Promise<{
  success: boolean;
  previewUrl?: string;
  previewId?: string;
  message?: string;
}> {
  try {
    // Generate PDF
    const pdfBuffer = await generatePDF(template, formData);
    
    // Generate a unique ID for the preview
    const previewId = uuidv4();
    
    // Upload PDF to temporary storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `preview-${template.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.pdf`;
    const filePath = `previews/${previewId}/${fileName}`;
    
    const uploadResult = await uploadFile(
      pdfBuffer,
      filePath,
      'application/pdf',
      'system', // Use 'system' as the user ID for previews
      false, // Don't overwrite existing files
      true, // Set as temporary (will be automatically deleted after a period)
    );
    
    if (!uploadResult.success) {
      return {
        success: false,
        message: 'Failed to upload preview',
      };
    }
    
    return {
      success: true,
      previewUrl: uploadResult.url,
      previewId,
    };
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    return {
      success: false,
      message: `Preview generation failed: ${error.message}`,
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
  
  // Set styles from template or use defaults
  const styling = template.templateData.styling || {};
  const fontSize = styling.fontSize || 12;
  const lineHeight = styling.lineHeight || 24;
  
  // Set margins
  const margins = template.templateData.margins || {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50,
  };
  
  // Set colors
  const primaryColor = styling.primaryColor
    ? hexToRgb(styling.primaryColor)
    : rgb(0, 0, 0);
  const secondaryColor = styling.secondaryColor
    ? hexToRgb(styling.secondaryColor)
    : rgb(0.5, 0.5, 0.5);
  
  // Add title
  page.drawText(template.templateData.title || template.name, {
    x: margins.left,
    y: pageHeight - margins.top,
    size: fontSize * 1.5,
    font: boldFont,
    color: primaryColor,
  });
  
  // Add watermark for preview
  page.drawText('PREVIEW - NOT FOR SUBMISSION', {
    x: pageWidth / 2 - 150,
    y: pageHeight / 2,
    size: fontSize * 2,
    font: boldFont,
    color: rgb(0.9, 0.9, 0.9),
    opacity: 0.3,
    rotate: {
      type: 'degrees',
      angle: -45,
    },
  });
  
  // Start position for content
  let yPosition = pageHeight - margins.top - lineHeight * 3;
  
  // Draw sections and fields
  for (const section of template.templateData.sections) {
    // Check if we need a new page
    if (yPosition < margins.bottom + lineHeight * 3) {
      // Add a new page
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margins.top;
    }
    
    // Draw section title if present
    if (section.title) {
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
        color: secondaryColor,
      });
      
      yPosition -= lineHeight;
    }
    
    // Draw fields
    for (const field of section.fields) {
      // Check if we need a new page
      if (yPosition < margins.bottom + lineHeight * 2) {
        // Add a new page
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margins.top;
      }
      
      // Draw field label
      page.drawText(`${field.label || field.name}:`, {
        x: margins.left,
        y: yPosition,
        size: fontSize,
        font: boldFont,
        color: primaryColor,
      });
      
      // Get field value
      const value = formData[field.name] || '';
      
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
  
  // Add preview timestamp
  const timestamp = new Date().toISOString();
  page.drawText(`Preview generated: ${timestamp}`, {
    x: margins.left,
    y: margins.bottom - lineHeight,
    size: fontSize * 0.7,
    font: font,
    color: secondaryColor,
  });
  
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
