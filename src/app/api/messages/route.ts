/**
 * Messages API Routes
 * 
 * Handles API endpoints for the messaging system.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as messagingService from '@/services/messaging/messagingService';
import { ConversationCreateData, MessageCreateData } from '@/types/message';

/**
 * GET /api/messages
 * 
 * Get conversations for the authenticated user
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Get conversations
    const conversations = await messagingService.getConversationsForUser(
      session.user.id,
      limit,
      offset
    );
    
    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Error getting conversations:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages
 * 
 * Create a new conversation
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
    if (!body.type) {
      return NextResponse.json(
        { error: 'Conversation type is required' },
        { status: 400 }
      );
    }
    
    if (!body.participantIds || !Array.isArray(body.participantIds) || body.participantIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant is required' },
        { status: 400 }
      );
    }
    
    // Create conversation
    const conversationData: ConversationCreateData = {
      title: body.title,
      type: body.type,
      caseId: body.caseId,
      participantIds: body.participantIds,
      initialMessage: body.initialMessage,
      metadata: body.metadata,
    };
    
    const conversation = await messagingService.createConversation(
      conversationData,
      session.user.id
    );
    
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
