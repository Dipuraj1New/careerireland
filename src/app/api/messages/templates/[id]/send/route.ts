/**
 * Send Message from Template API Route
 * 
 * Handles API endpoint for sending messages from templates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as messagingService from '@/services/messaging/messagingService';

/**
 * POST /api/messages/templates/[id]/send
 * 
 * Send a message using a template
 */
export async function POST(
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
    
    // Validate request
    if (!body.conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }
    
    // Send message from template
    const message = await messagingService.sendMessageFromTemplate(
      params.id,
      body.conversationId,
      body.variables || {},
      session.user.id
    );
    
    if (!message) {
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error('Error sending message from template:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to send message from template' },
      { status: 500 }
    );
  }
}
