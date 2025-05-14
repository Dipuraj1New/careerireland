import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import * as formTemplateService from '@/services/form/formTemplateService';
import * as regulatoryUpdateService from '@/services/form/regulatoryUpdateService';
import { UserRole } from '@/types/user';

/**
 * GET /api/forms/templates/:id/regulatory-updates
 * Get regulatory updates for a form template
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
    
    // Check if template exists
    const template = await formTemplateService.getFormTemplateById(params.id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Get regulatory updates
    const updates = await regulatoryUpdateService.getRegulatoryUpdates(params.id);
    
    return NextResponse.json({ updates });
  } catch (error: any) {
    console.error('Error fetching regulatory updates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch regulatory updates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forms/templates/:id/regulatory-updates
 * Create a new regulatory update for a form template
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
    
    // Check if user has permission to create regulatory updates
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.AGENT) {
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
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    if (!body.description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }
    
    if (!body.regulatoryReference) {
      return NextResponse.json(
        { error: 'Regulatory reference is required' },
        { status: 400 }
      );
    }
    
    if (!body.effectiveDate) {
      return NextResponse.json(
        { error: 'Effective date is required' },
        { status: 400 }
      );
    }
    
    if (!body.changeDescription) {
      return NextResponse.json(
        { error: 'Change description is required' },
        { status: 400 }
      );
    }
    
    // Create regulatory update
    const update = await regulatoryUpdateService.createRegulatoryUpdate({
      templateId: params.id,
      title: body.title,
      description: body.description,
      regulatoryReference: body.regulatoryReference,
      effectiveDate: new Date(body.effectiveDate),
      changeDescription: body.changeDescription,
      notifyUsers: body.notifyUsers === true,
      userId: session.user.id,
    });
    
    // Send notifications if requested
    if (body.notifyUsers === true) {
      await regulatoryUpdateService.sendRegulatoryUpdateNotifications(update.id);
    }
    
    return NextResponse.json({ update });
  } catch (error: any) {
    console.error('Error creating regulatory update:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create regulatory update' },
      { status: 500 }
    );
  }
}
