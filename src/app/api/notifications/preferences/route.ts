import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import db from '@/lib/db';
import { NotificationType } from '@/types/notification';

interface NotificationPreference {
  type: NotificationType;
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the current user
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
    
    // Get notification preferences from database
    const result = await db.query(
      `SELECT * FROM notification_preferences 
       WHERE user_id = $1`,
      [user.id]
    );
    
    // If no preferences found, return default preferences
    if (result.rows.length === 0) {
      const defaultPreferences = Object.values(NotificationType).map(type => ({
        type,
        inApp: true,
        email: type === NotificationType.CASE_APPROVED || 
               type === NotificationType.CASE_REJECTED || 
               type === NotificationType.ACTION_REQUIRED,
        sms: false
      }));
      
      return NextResponse.json(
        { preferences: defaultPreferences },
        { status: 200 }
      );
    }
    
    // Map database rows to preference objects
    const preferences = result.rows.map(row => ({
      type: row.notification_type,
      inApp: row.in_app,
      email: row.email,
      sms: row.sms
    }));
    
    return NextResponse.json(
      { preferences },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to get notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Update notification preferences for the current user
 */
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get preferences from request body
    const body = await request.json();
    const { preferences } = body;
    
    if (!preferences || !Array.isArray(preferences)) {
      return NextResponse.json(
        { error: 'Invalid preferences data' },
        { status: 400 }
      );
    }
    
    // Start a transaction
    await db.query('BEGIN');
    
    try {
      // Delete existing preferences
      await db.query(
        `DELETE FROM notification_preferences 
         WHERE user_id = $1`,
        [user.id]
      );
      
      // Insert new preferences
      for (const pref of preferences) {
        await db.query(
          `INSERT INTO notification_preferences (
            user_id, notification_type, in_app, email, sms
          ) VALUES ($1, $2, $3, $4, $5)`,
          [user.id, pref.type, pref.inApp, pref.email, pref.sms]
        );
      }
      
      // Commit transaction
      await db.query('COMMIT');
      
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
