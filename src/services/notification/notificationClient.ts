/**
 * Notification Client Service
 * 
 * Client-side service for interacting with notification API endpoints
 */
import { Notification, NotificationType } from '@/types/notification';

interface NotificationPreference {
  type: NotificationType;
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

/**
 * Get notifications for the current user
 */
export async function getUserNotifications(): Promise<Notification[]> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching notifications: ${response.statusText}`);
    }

    const data = await response.json();
    return data.notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(id: string): Promise<Notification> {
  try {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error marking notification as read: ${response.statusText}`);
    }

    const data = await response.json();
    return data.notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const response = await fetch('/api/notifications/read-all', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error marking all notifications as read: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get notification preferences for the current user
 */
export async function getUserNotificationPreferences(): Promise<NotificationPreference[]> {
  try {
    const response = await fetch('/api/notifications/preferences', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching notification preferences: ${response.statusText}`);
    }

    const data = await response.json();
    return data.preferences;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
}

/**
 * Update notification preferences for the current user
 */
export async function updateUserNotificationPreferences(
  preferences: NotificationPreference[]
): Promise<void> {
  try {
    const response = await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });

    if (!response.ok) {
      throw new Error(`Error updating notification preferences: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

export default {
  getUserNotifications,
  markAsRead,
  markAllNotificationsAsRead,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
};
