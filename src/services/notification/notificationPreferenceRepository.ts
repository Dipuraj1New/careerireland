/**
 * Notification Preference Repository
 *
 * Handles database operations for notification preferences.
 */
import db from '@/lib/db';
import { NotificationType, NotificationPreference } from '@/types/notification';

/**
 * Get all notification preferences for a user
 */
export async function getAllUserNotificationPreferences(
  userId: string
): Promise<NotificationPreference[]> {
  const result = await db.query(
    `SELECT * FROM notification_preferences
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows.map(mapNotificationPreferenceFromDb);
}

/**
 * Get notification preference for a specific type
 */
export async function getUserNotificationPreference(
  userId: string,
  type: NotificationType
): Promise<NotificationPreference | null> {
  const result = await db.query(
    `SELECT * FROM notification_preferences
     WHERE user_id = $1 AND notification_type = $2`,
    [userId, type]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapNotificationPreferenceFromDb(result.rows[0]);
}

/**
 * Get notification preference for a specific type, with defaults if not found
 */
export async function getUserNotificationPreferences(
  userId: string,
  type: NotificationType
): Promise<{ inApp: boolean; email: boolean; sms: boolean }> {
  const preference = await getUserNotificationPreference(userId, type);

  if (!preference) {
    // Default preferences if not found
    return {
      inApp: true,
      email: type === NotificationType.CASE_APPROVED ||
             type === NotificationType.CASE_REJECTED ||
             type === NotificationType.ACTION_REQUIRED,
      sms: false,
    };
  }

  return {
    inApp: preference.inApp,
    email: preference.email,
    sms: preference.sms,
  };
}

/**
 * Create or update notification preference
 */
export async function setUserNotificationPreference(
  userId: string,
  type: NotificationType,
  inApp: boolean,
  email: boolean,
  sms: boolean
): Promise<NotificationPreference> {
  // Check if preference exists
  const existingPreference = await getUserNotificationPreference(userId, type);

  if (existingPreference) {
    // Update existing preference
    const result = await db.query(
      `UPDATE notification_preferences
       SET in_app = $3, email = $4, sms = $5, updated_at = NOW()
       WHERE user_id = $1 AND notification_type = $2
       RETURNING *`,
      [userId, type, inApp, email, sms]
    );

    return mapNotificationPreferenceFromDb(result.rows[0]);
  } else {
    // Create new preference
    const result = await db.query(
      `INSERT INTO notification_preferences (
        user_id, notification_type, in_app, email, sms, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *`,
      [userId, type, inApp, email, sms]
    );

    return mapNotificationPreferenceFromDb(result.rows[0]);
  }
}

/**
 * Update multiple notification preferences for a user
 */
export async function updateUserNotificationPreferences(
  userId: string,
  preferences: Array<{
    type: NotificationType;
    inApp: boolean;
    email: boolean;
    sms: boolean;
  }>
): Promise<NotificationPreference[]> {
  // Start a transaction
  await db.query('BEGIN');

  try {
    // Delete existing preferences
    await db.query(
      `DELETE FROM notification_preferences
       WHERE user_id = $1`,
      [userId]
    );

    // Insert new preferences
    const updatedPreferences: NotificationPreference[] = [];

    for (const pref of preferences) {
      const result = await db.query(
        `INSERT INTO notification_preferences (
          user_id, notification_type, in_app, email, sms, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *`,
        [userId, pref.type, pref.inApp, pref.email, pref.sms]
      );

      updatedPreferences.push(mapNotificationPreferenceFromDb(result.rows[0]));
    }

    // Commit transaction
    await db.query('COMMIT');

    return updatedPreferences;
  } catch (error) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    throw error;
  }
}

/**
 * Map notification preference from database row to NotificationPreference object
 */
function mapNotificationPreferenceFromDb(row: any): NotificationPreference {
  return {
    id: row.id.toString(),
    userId: row.user_id,
    type: row.notification_type,
    inApp: row.in_app,
    email: row.email,
    sms: row.sms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default {
  getAllUserNotificationPreferences,
  getUserNotificationPreferences,
  getUserNotificationPreference,
  setUserNotificationPreference,
  updateUserNotificationPreferences,
};
