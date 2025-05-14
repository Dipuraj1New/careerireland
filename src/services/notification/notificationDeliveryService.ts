/**
 * Notification Delivery Service
 * 
 * Handles the delivery of notifications across multiple channels (in-app, email, SMS)
 * based on user preferences.
 */
import { v4 as uuidv4 } from 'uuid';
import { 
  Notification, 
  NotificationType, 
  NotificationCreateData 
} from '@/types/notification';
import { createNotification } from './notificationRepository';
import { getUserNotificationPreferences } from './notificationPreferenceRepository';
import { sendNotificationEmail } from './emailService';
import { sendNotificationSms } from './smsService';

// Notification delivery options
interface NotificationDeliveryOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  link?: string;
  metadata?: Record<string, any>;
}

// Notification delivery result
interface NotificationDeliveryResult {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  notification?: Notification;
}

/**
 * Deliver a notification to a user through their preferred channels
 */
export async function deliverNotification(
  options: NotificationDeliveryOptions
): Promise<NotificationDeliveryResult> {
  try {
    // Get user notification preferences
    const preferences = await getUserNotificationPreferences(options.userId, options.type);
    
    // Initialize delivery result
    const result: NotificationDeliveryResult = {
      inApp: false,
      email: false,
      sms: false,
    };
    
    // Deliver in-app notification if preferred
    if (preferences.inApp) {
      const notificationData: NotificationCreateData = {
        id: uuidv4(),
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        isRead: false,
        entityId: options.entityId,
        entityType: options.entityType,
        link: options.link,
        createdAt: new Date(),
        metadata: options.metadata,
      };
      
      result.notification = await createNotification(notificationData);
      result.inApp = true;
    }
    
    // Deliver email notification if preferred
    if (preferences.email) {
      result.email = await sendNotificationEmail(
        options.userId,
        options.type,
        options.title,
        options.message,
        {
          entityId: options.entityId,
          entityType: options.entityType,
          link: options.link,
          ...options.metadata,
        }
      );
    }
    
    // Deliver SMS notification if preferred
    if (preferences.sms) {
      result.sms = await sendNotificationSms(
        options.userId,
        options.type,
        options.title,
        options.message,
        {
          entityId: options.entityId,
          entityType: options.entityType,
          link: options.link,
          ...options.metadata,
        }
      );
    }
    
    return result;
  } catch (error) {
    console.error('Error delivering notification:', error);
    throw error;
  }
}

/**
 * Schedule a notification for future delivery
 */
export async function scheduleNotification(
  options: NotificationDeliveryOptions,
  deliveryDate: Date
): Promise<string> {
  try {
    // Calculate delay in milliseconds
    const now = new Date();
    const delay = deliveryDate.getTime() - now.getTime();
    
    if (delay <= 0) {
      // If delivery date is in the past or now, deliver immediately
      await deliverNotification(options);
      return 'immediate';
    }
    
    // Generate a unique ID for the scheduled notification
    const scheduledId = uuidv4();
    
    // Schedule the notification using setTimeout
    setTimeout(async () => {
      try {
        await deliverNotification(options);
        console.log(`Scheduled notification ${scheduledId} delivered successfully`);
      } catch (error) {
        console.error(`Error delivering scheduled notification ${scheduledId}:`, error);
      }
    }, delay);
    
    console.log(`Notification scheduled for delivery in ${Math.round(delay / 1000)} seconds with ID ${scheduledId}`);
    return scheduledId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

export default {
  deliverNotification,
  scheduleNotification,
};
