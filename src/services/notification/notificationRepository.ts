/**
 * Notification Repository
 * 
 * Handles database operations for notifications.
 */
import db from '@/lib/db';
import { 
  Notification, 
  NotificationType, 
  NotificationCreateData 
} from '@/types/notification';

/**
 * Create a notification
 */
export async function createNotification(
  notificationData: NotificationCreateData
): Promise<Notification> {
  const result = await db.query(
    `INSERT INTO notifications (
      id, user_id, type, title, message, is_read, entity_id, entity_type, link, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      notificationData.id,
      notificationData.userId,
      notificationData.type,
      notificationData.title,
      notificationData.message,
      notificationData.isRead,
      notificationData.entityId || null,
      notificationData.entityType || null,
      notificationData.link || null,
      notificationData.createdAt,
    ]
  );
  
  return mapNotificationFromDb(result.rows[0]);
}

/**
 * Get notifications by user ID
 */
export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
  const result = await db.query(
    `SELECT * FROM notifications 
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  
  return result.rows.map(mapNotificationFromDb);
}

/**
 * Get unread notifications by user ID
 */
export async function getUnreadNotificationsByUserId(userId: string): Promise<Notification[]> {
  const result = await db.query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 AND is_read = false
     ORDER BY created_at DESC`,
    [userId]
  );
  
  return result.rows.map(mapNotificationFromDb);
}

/**
 * Get notification by ID
 */
export async function getNotificationById(id: string): Promise<Notification | null> {
  const result = await db.query(
    `SELECT * FROM notifications 
     WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapNotificationFromDb(result.rows[0]);
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string): Promise<Notification | null> {
  const result = await db.query(
    `UPDATE notifications 
     SET is_read = true 
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapNotificationFromDb(result.rows[0]);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await db.query(
    `UPDATE notifications 
     SET is_read = true 
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
}

/**
 * Delete notification
 */
export async function deleteNotification(id: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM notifications 
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  
  return result.rows.length > 0;
}

/**
 * Map notification from database row to Notification object
 */
function mapNotificationFromDb(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    entityId: row.entity_id,
    entityType: row.entity_type,
    link: row.link,
    createdAt: row.created_at,
  };
}

export default {
  createNotification,
  getNotificationsByUserId,
  getUnreadNotificationsByUserId,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
