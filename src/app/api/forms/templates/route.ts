import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import * as formTemplateService from '@/services/form/formTemplateService';
import { FormTemplateStatus } from '@/types/form';
import { UserRole } from '@/types/user';
import { DocumentType } from '@/types/document';

/**
 * GET /api/forms/templates
 * Get form templates
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') as FormTemplateStatus | null;
    const documentType = searchParams.get('documentType') as DocumentType | null;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    // Get templates
    const templates = await formTemplateService.getFormTemplates({
      status,
      documentType,
      limit,
      offset,
    });
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error getting form templates:', error);
    return NextResponse.json(
      { error: 'Failed to get form templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forms/templates
 * Create a new form template
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
    
    // Check if user is admin or agent
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.AGENT) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Create template
    const template = await formTemplateService.createFormTemplate(
      body,
      session.user.id
    );
    
    return NextResponse.json(
      { template },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating form template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create form template' },
      { status: 500 }
    );
  }
}
