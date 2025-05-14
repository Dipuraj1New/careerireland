/**
 * Conversation Participants API Routes
 * 
 * Handles API endpoints for participants in a conversation.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as messagingService from '@/services/messaging/messagingService';

/**
 * POST /api/messages/[id]/participants
 * 
 * Add a user to a conversation
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
    if (!body.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Add user to conversation
    const participant = await messagingService.addUserToConversation(
      params.id,
      body.userId,
      session.user.id
    );
    
    return NextResponse.json({ participant }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding user to conversation:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to add user to conversation' },
      { status: 500 }
    );
  }
}
