import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import * as formTemplateService from '@/services/form/formTemplateService';
import { UserRole } from '@/types/user';

/**
 * GET /api/forms/templates/:id
 * Get form template by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get template
    const template = await formTemplateService.getFormTemplateById(params.id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error getting form template:', error);
    return NextResponse.json(
      { error: 'Failed to get form template' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/forms/templates/:id
 * Update form template
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin or agent
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.AGENT) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const createNewVersion = body.createNewVersion === true;
    
    // Remove createNewVersion from body
    delete body.createNewVersion;
    
    // Update template
    const template = await formTemplateService.updateFormTemplate(
      params.id,
      body,
      session.user.id,
      createNewVersion
    );
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error updating form template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update form template' },
      { status: 500 }
    );
  }
}
