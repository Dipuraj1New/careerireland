import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import formGenerationService from '@/services/form/formGenerationService';

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
    const { templateId, formData, caseId } = body;

    // Validate required fields
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

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    // Generate form
    const result = await formGenerationService.generateForm(
      templateId,
      formData,
      caseId,
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message,
          missingFields: result.missingFields,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: result.submission,
    });
  } catch (error: any) {
    console.error('Error generating form:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate form' },
      { status: 500 }
    );
  }
}
