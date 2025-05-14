/**
 * Conversation API Routes
 * 
 * Handles API endpoints for specific conversations.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as messagingService from '@/services/messaging/messagingService';

/**
 * GET /api/messages/[id]
 * 
 * Get a specific conversation
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
    
    // Get conversation
    const conversation = await messagingService.getConversation(params.id);
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    // Check if user is a participant
    const isParticipant = conversation.participants?.some(
      p => p.userId === session.user.id && !p.leftAt
    );
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ conversation });
  } catch (error: any) {
    console.error('Error getting conversation:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get conversation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/messages/[id]
 * 
 * Mark messages as read in a conversation
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
    
    // Check action
    if (body.action === 'mark_read') {
      // Mark messages as read
      await messagingService.markMessagesAsRead(params.id, session.user.id);
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to update conversation' },
      { status: 500 }
    );
  }
}
