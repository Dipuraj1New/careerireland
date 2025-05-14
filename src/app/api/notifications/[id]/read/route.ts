import { NextRequest, NextResponse } from 'next/server';
import { markAsRead } from '@/services/notification/notificationService';
import { getUserFromRequest } from '@/lib/auth';
import { getNotificationById } from '@/services/notification/notificationRepository';

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get authenticated user
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if notification exists and belongs to the user
    const notification = await getNotificationById(id);
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    if (notification.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Mark notification as read
    const updatedNotification = await markAsRead(id);
    
    return NextResponse.json(
      { notification: updatedNotification },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
