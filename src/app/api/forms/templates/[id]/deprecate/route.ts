import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import * as formTemplateService from '@/services/form/formTemplateService';
import { UserRole } from '@/types/user';

/**
 * POST /api/forms/templates/:id/deprecate
 * Deprecate a form template
 */
export async function POST(
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
    
    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Deprecate template
    const template = await formTemplateService.deprecateFormTemplate(
      params.id,
      session.user.id
    );
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error deprecating form template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deprecate form template' },
      { status: 500 }
    );
  }
}
