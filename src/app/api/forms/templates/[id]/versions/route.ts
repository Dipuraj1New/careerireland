import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import * as formTemplateService from '@/services/form/formTemplateService';

/**
 * GET /api/forms/templates/:id/versions
 * Get form template versions
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
    
    // Get template versions
    const versions = await formTemplateService.getFormTemplateVersions(params.id);
    
    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error getting form template versions:', error);
    return NextResponse.json(
      { error: 'Failed to get form template versions' },
      { status: 500 }
    );
  }
}
