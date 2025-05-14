import { NextRequest, NextResponse } from 'next/server';
import { getUserNotifications } from '@/services/notification/notificationService';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/notifications
 * Get notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get notifications for the user
    const notifications = await getUserNotifications(user.id);
    
    return NextResponse.json(
      { notifications },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}
