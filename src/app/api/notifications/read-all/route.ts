import { NextRequest, NextResponse } from 'next/server';
import { markAllNotificationsAsRead } from '@/services/notification/notificationRepository';
import { getUserFromRequest } from '@/lib/auth';

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Mark all notifications as read
    await markAllNotificationsAsRead(user.id);
    
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
