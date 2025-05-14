/**
 * Notification Service
 *
 * Handles creation and management of notifications for various system events.
 * Supports multi-channel delivery (in-app, email, SMS) based on user preferences.
 */
import { v4 as uuidv4 } from 'uuid';
import {
  createNotification as createNotificationInDb,
  getNotificationsByUserId,
  markNotificationAsRead
} from './notificationRepository';

// Re-export createNotification for external use
export const createNotification = createNotificationInDb;
import { getUserById } from '@/services/user/userRepository';
import { getCaseById } from '@/services/case/caseRepository';
import {
  Notification,
  NotificationType,
  NotificationCreateData
} from '@/types/notification';
import { CaseStatus, CASE_STATUS_LABELS } from '@/types/case';
import { UserRole } from '@/types/user';
import { deliverNotification, scheduleNotification } from './notificationDeliveryService';

/**
 * Create a notification
 */
export async function createUserNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  entityId?: string,
  entityType?: string,
  link?: string,
  metadata?: Record<string, any>
): Promise<Notification | null> {
  try {
    // Deliver notification through preferred channels
    const deliveryResult = await deliverNotification({
      userId,
      type,
      title,
      message,
      entityId,
      entityType,
      link,
      metadata
    });

    // Return the in-app notification if created
    return deliveryResult.notification || null;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Schedule a notification for future delivery
 */
export async function scheduleUserNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  deliveryDate: Date,
  entityId?: string,
  entityType?: string,
  link?: string,
  metadata?: Record<string, any>
): Promise<string> {
  try {
    return await scheduleNotification(
      {
        userId,
        type,
        title,
        message,
        entityId,
        entityType,
        link,
        metadata
      },
      deliveryDate
    );
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

/**
 * Create a case status change notification
 */
export async function createCaseStatusNotification(
  caseId: string,
  previousStatus: CaseStatus,
  newStatus: CaseStatus
): Promise<void> {
  try {
    // Get case data
    const caseData = await getCaseById(caseId);

    if (!caseData) {
      throw new Error(`Case not found: ${caseId}`);
    }

    // Create notification for applicant
    await createUserNotification(
      caseData.applicantId,
      NotificationType.CASE_STATUS_CHANGE,
      'Case Status Updated',
      `Your case status has been updated from ${CASE_STATUS_LABELS[previousStatus]} to ${CASE_STATUS_LABELS[newStatus]}.`,
      caseId,
      'case',
      `/cases/${caseId}`,
      {
        previousStatus,
        newStatus,
        caseId
      }
    );

    // Create notification for agent if assigned
    if (caseData.agentId) {
      await createUserNotification(
        caseData.agentId,
        NotificationType.CASE_STATUS_CHANGE,
        'Case Status Updated',
        `Case ${caseId.substring(0, 8)} status has been updated from ${CASE_STATUS_LABELS[previousStatus]} to ${CASE_STATUS_LABELS[newStatus]}.`,
        caseId,
        'case',
        `/cases/${caseId}`,
        {
          previousStatus,
          newStatus,
          caseId
        }
      );
    }

    // Create additional notifications based on specific status changes
    if (newStatus === CaseStatus.ADDITIONAL_INFO_REQUIRED) {
      await createUserNotification(
        caseData.applicantId,
        NotificationType.ACTION_REQUIRED,
        'Action Required',
        'Additional information is required for your case. Please review and provide the requested information.',
        caseId,
        'case',
        `/cases/${caseId}`,
        {
          actionType: 'Additional Information',
          caseId
        }
      );
    }

    if (newStatus === CaseStatus.APPROVED) {
      await createUserNotification(
        caseData.applicantId,
        NotificationType.CASE_APPROVED,
        'Case Approved',
        'Congratulations! Your case has been approved.',
        caseId,
        'case',
        `/cases/${caseId}`,
        {
          caseId
        }
      );
    }

    if (newStatus === CaseStatus.REJECTED) {
      await createUserNotification(
        caseData.applicantId,
        NotificationType.CASE_REJECTED,
        'Case Rejected',
        'We regret to inform you that your case has been rejected. Please review the details for more information.',
        caseId,
        'case',
        `/cases/${caseId}`,
        {
          caseId
        }
      );
    }
  } catch (error) {
    console.error('Error creating case status notification:', error);
    throw error;
  }
}

/**
 * Create a document upload notification
 */
export async function createDocumentUploadNotification(
  documentId: string,
  caseId: string,
  uploadedBy: string,
  documentType: string
): Promise<void> {
  try {
    // Get case data
    const caseData = await getCaseById(caseId);

    if (!caseData) {
      throw new Error(`Case not found: ${caseId}`);
    }

    // Get user who uploaded the document
    const user = await getUserById(uploadedBy);

    if (!user) {
      throw new Error(`User not found: ${uploadedBy}`);
    }

    // If uploaded by applicant, notify agent if assigned
    if (user.role === UserRole.APPLICANT && caseData.agentId) {
      await createUserNotification(
        caseData.agentId,
        NotificationType.DOCUMENT_UPLOADED,
        'New Document Uploaded',
        `A new ${documentType} document has been uploaded for case ${caseId.substring(0, 8)}.`,
        documentId,
        'document',
        `/documents?caseId=${caseId}`,
        {
          documentType,
          caseId,
          uploadedBy: user.firstName + ' ' + user.lastName
        }
      );
    }

    // If uploaded by agent, notify applicant
    if ((user.role === UserRole.AGENT || user.role === UserRole.ADMIN) && uploadedBy !== caseData.applicantId) {
      await createUserNotification(
        caseData.applicantId,
        NotificationType.DOCUMENT_UPLOADED,
        'New Document Uploaded',
        `A new ${documentType} document has been uploaded to your case.`,
        documentId,
        'document',
        `/documents?caseId=${caseId}`,
        {
          documentType,
          caseId,
          uploadedBy: user.firstName + ' ' + user.lastName
        }
      );
    }
  } catch (error) {
    console.error('Error creating document upload notification:', error);
    throw error;
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    return await getNotificationsByUserId(userId);
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(id: string): Promise<Notification | null> {
  try {
    return await markNotificationAsRead(id);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export default {
  createNotification,
  createUserNotification,
  scheduleUserNotification,
  createCaseStatusNotification,
  createDocumentUploadNotification,
  getUserNotifications,
  markAsRead,
};
