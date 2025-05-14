/**
 * Conversation Messages API Routes
 * 
 * Handles API endpoints for messages within a conversation.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as messagingService from '@/services/messaging/messagingService';
import { MessageCreateData } from '@/types/message';

/**
 * GET /api/messages/[id]/messages
 * 
 * Get messages for a specific conversation
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
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');
    
    // Get messages
    const messages = await messagingService.getMessagesForConversation(
      params.id,
      limit,
      before ? new Date(before) : undefined
    );
    
    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Error getting messages:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/[id]/messages
 * 
 * Send a message to a conversation
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
    if (!body.content && (!body.attachments || body.attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message content or attachments are required' },
        { status: 400 }
      );
    }
    
    // Create message
    const messageData: MessageCreateData = {
      conversationId: params.id,
      content: body.content || '',
      parentId: body.parentId,
      metadata: body.metadata,
      attachments: body.attachments,
    };
    
    const message = await messagingService.createMessage(
      messageData,
      session.user.id
    );
    
    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error('Error sending message:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
