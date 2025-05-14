import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import * as formTemplateService from '@/services/form/formTemplateService';
import * as formMigrationService from '@/services/form/formMigrationService';
import { UserRole } from '@/types/user';

/**
 * POST /api/forms/templates/:id/migrate
 * Migrate form submissions between template versions
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
    
    // Check if user has permission to migrate templates
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Check if template exists
    const template = await formTemplateService.getFormTemplateById(params.id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { sourceVersionId, targetVersionId, submissionIds } = body;
    
    // Validate required fields
    if (!sourceVersionId) {
      return NextResponse.json(
        { error: 'Source version ID is required' },
        { status: 400 }
      );
    }
    
    if (!targetVersionId) {
      return NextResponse.json(
        { error: 'Target version ID is required' },
        { status: 400 }
      );
    }
    
    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one submission ID is required' },
        { status: 400 }
      );
    }
    
    // Migrate submissions
    const results = await formMigrationService.migrateSubmissions({
      templateId: params.id,
      sourceVersionId,
      targetVersionId,
      submissionIds,
      userId: session.user.id,
    });
    
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error migrating submissions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to migrate submissions' },
      { status: 500 }
    );
  }
}
