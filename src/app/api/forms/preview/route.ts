import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import * as formTemplateService from '@/services/form/formTemplateService';
import { generatePDFPreview } from '@/services/form/formPreviewService';
import { FormTemplateStatus } from '@/types/form';

/**
 * POST /api/forms/preview
 * Generate a form preview without saving
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { templateId, formData } = body;
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    if (!formData) {
      return NextResponse.json(
        { error: 'Form data is required' },
        { status: 400 }
      );
    }
    
    // Get template
    const template = await formTemplateService.getFormTemplateById(templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: `Template with ID ${templateId} not found` },
        { status: 404 }
      );
    }
    
    // Check if template is active or draft
    if (template.status !== FormTemplateStatus.ACTIVE && template.status !== FormTemplateStatus.DRAFT) {
      return NextResponse.json(
        { error: `Template with ID ${templateId} is not available for preview` },
        { status: 400 }
      );
    }
    
    // Check for missing required fields
    const missingFields = template.requiredFields.filter(
      field => !formData[field]
    );
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields,
        },
        { status: 400 }
      );
    }
    
    // Generate PDF preview
    const result = await generatePDFPreview(template, formData);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
    
    // Return the preview data
    return NextResponse.json({
      success: true,
      previewUrl: result.previewUrl,
      previewId: result.previewId,
    });
  } catch (error: any) {
    console.error('Error generating form preview:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate form preview' },
      { status: 500 }
    );
  }
}
