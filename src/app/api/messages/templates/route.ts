/**
 * Message Templates API Routes
 * 
 * Handles API endpoints for message templates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as messagingService from '@/services/messaging/messagingService';
import { MessageTemplateCreateData } from '@/types/message';

/**
 * GET /api/messages/templates
 * 
 * Get message templates
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    
    // Get templates
    const templates = await messagingService.getMessageTemplates(
      category,
      activeOnly
    );
    
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error getting message templates:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get message templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/templates
 * 
 * Create a new message template
 */
export async function POST(req: NextRequest) {
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
    
    // Validate request
    if (!body.name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }
    
    if (!body.content) {
      return NextResponse.json(
        { error: 'Template content is required' },
        { status: 400 }
      );
    }
    
    if (!body.category) {
      return NextResponse.json(
        { error: 'Template category is required' },
        { status: 400 }
      );
    }
    
    // Create template
    const templateData: MessageTemplateCreateData = {
      name: body.name,
      content: body.content,
      category: body.category,
      variables: body.variables,
      isActive: body.isActive,
      metadata: body.metadata,
    };
    
    const template = await messagingService.createMessageTemplate(
      templateData,
      session.user.id
    );
    
    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating message template:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create message template' },
      { status: 500 }
    );
  }
}
