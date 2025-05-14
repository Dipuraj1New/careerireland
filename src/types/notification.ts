/**
 * Notification Types and Interfaces
 */

/**
 * Notification Type Enum
 */
export enum NotificationType {
  CASE_STATUS_CHANGE = 'case_status_change',
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_VALIDATED = 'document_validated',
  DOCUMENT_REJECTED = 'document_rejected',
  CASE_ASSIGNED = 'case_assigned',
  CASE_APPROVED = 'case_approved',
  CASE_REJECTED = 'case_rejected',
  ACTION_REQUIRED = 'action_required',
  COMMENT_ADDED = 'comment_added',
  APPOINTMENT_SCHEDULED = 'appointment_scheduled',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_DUE = 'payment_due',
  SYSTEM = 'system',
}

/**
 * Notification Interface
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  entityId?: string;
  entityType?: 'case' | 'document' | 'appointment' | 'payment' | 'comment';
  link?: string;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Notification Creation Data
 */
export interface NotificationCreateData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityId?: string;
  entityType?: 'case' | 'document' | 'appointment' | 'payment' | 'comment';
  link?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Notification Update Data
 */
export interface NotificationUpdateData {
  isRead?: boolean;
  readAt?: Date;
}

/**
 * Notification Filter Options
 */
export interface NotificationFilterOptions {
  userId?: string;
  type?: NotificationType;
  isRead?: boolean;
  entityType?: string;
  entityId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Notification Sort Options
 */
export type NotificationSortOption = 'newest' | 'oldest' | 'unread';

/**
 * Notification Preference
 */
export interface NotificationPreference {
  id?: string;
  userId: string;
  type: NotificationType;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Notification Type Labels
 */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.CASE_STATUS_CHANGE]: 'Case Status Change',
  [NotificationType.DOCUMENT_UPLOADED]: 'Document Uploaded',
  [NotificationType.DOCUMENT_VALIDATED]: 'Document Validated',
  [NotificationType.DOCUMENT_REJECTED]: 'Document Rejected',
  [NotificationType.CASE_ASSIGNED]: 'Case Assigned',
  [NotificationType.CASE_APPROVED]: 'Case Approved',
  [NotificationType.CASE_REJECTED]: 'Case Rejected',
  [NotificationType.ACTION_REQUIRED]: 'Action Required',
  [NotificationType.COMMENT_ADDED]: 'Comment Added',
  [NotificationType.APPOINTMENT_SCHEDULED]: 'Appointment Scheduled',
  [NotificationType.APPOINTMENT_REMINDER]: 'Appointment Reminder',
  [NotificationType.APPOINTMENT_CANCELLED]: 'Appointment Cancelled',
  [NotificationType.PAYMENT_RECEIVED]: 'Payment Received',
  [NotificationType.PAYMENT_DUE]: 'Payment Due',
  [NotificationType.SYSTEM]: 'System Notification',
};
