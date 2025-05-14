/**
 * Message Template API Routes
 * 
 * Handles API endpoints for specific message templates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as messagingService from '@/services/messaging/messagingService';
import { MessageTemplateUpdateData } from '@/types/message';

/**
 * GET /api/messages/templates/[id]
 * 
 * Get a specific message template
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get template
    const template = await messagingService.getMessageTemplateById(params.id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error getting message template:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get message template' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/messages/templates/[id]
 * 
 * Update a message template
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await req.json();
    
    // Update template
    const templateData: MessageTemplateUpdateData = {};
    
    if (body.name !== undefined) templateData.name = body.name;
    if (body.content !== undefined) templateData.content = body.content;
    if (body.category !== undefined) templateData.category = body.category;
    if (body.variables !== undefined) templateData.variables = body.variables;
    if (body.isActive !== undefined) templateData.isActive = body.isActive;
    if (body.metadata !== undefined) templateData.metadata = body.metadata;
    
    const template = await messagingService.updateMessageTemplate(
      params.id,
      templateData,
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
    console.error('Error updating message template:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to update message template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/messages/templates/[id]
 * 
 * Delete a message template (soft delete by setting isActive to false)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Soft delete template by setting isActive to false
    const template = await messagingService.updateMessageTemplate(
      params.id,
      { isActive: false },
      session.user.id
    );
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting message template:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete message template' },
      { status: 500 }
    );
  }
}
