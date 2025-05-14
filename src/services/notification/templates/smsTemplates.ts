/**
 * SMS Templates
 * 
 * Provides templates for different types of notification SMS messages.
 * SMS templates are kept short and concise due to character limitations.
 */
import { NotificationType } from '@/types/notification';

// SMS template content
interface SmsTemplateContent {
  message: string;
}

// Template data
interface TemplateData {
  title: string;
  message: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

/**
 * Get SMS template for a notification type
 */
export function getSmsTemplate(
  type: NotificationType,
  data: TemplateData
): SmsTemplateContent {
  switch (type) {
    case NotificationType.CASE_STATUS_CHANGE:
      return getCaseStatusChangeSmsTemplate(data);
    case NotificationType.DOCUMENT_UPLOADED:
      return getDocumentUploadedSmsTemplate(data);
    case NotificationType.DOCUMENT_VALIDATED:
      return getDocumentValidatedSmsTemplate(data);
    case NotificationType.DOCUMENT_REJECTED:
      return getDocumentRejectedSmsTemplate(data);
    case NotificationType.CASE_ASSIGNED:
      return getCaseAssignedSmsTemplate(data);
    case NotificationType.CASE_APPROVED:
      return getCaseApprovedSmsTemplate(data);
    case NotificationType.CASE_REJECTED:
      return getCaseRejectedSmsTemplate(data);
    case NotificationType.ACTION_REQUIRED:
      return getActionRequiredSmsTemplate(data);
    case NotificationType.COMMENT_ADDED:
      return getCommentAddedSmsTemplate(data);
    case NotificationType.APPOINTMENT_SCHEDULED:
      return getAppointmentScheduledSmsTemplate(data);
    case NotificationType.APPOINTMENT_REMINDER:
      return getAppointmentReminderSmsTemplate(data);
    case NotificationType.APPOINTMENT_CANCELLED:
      return getAppointmentCancelledSmsTemplate(data);
    case NotificationType.PAYMENT_RECEIVED:
      return getPaymentReceivedSmsTemplate(data);
    case NotificationType.PAYMENT_DUE:
      return getPaymentDueSmsTemplate(data);
    case NotificationType.SYSTEM:
    default:
      return getDefaultSmsTemplate(data);
  }
}

/**
 * Get default SMS template
 */
function getDefaultSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  
  return {
    message: `${greeting}${data.title}: ${data.message} - Career Ireland`,
  };
}

/**
 * Get case status change SMS template
 */
function getCaseStatusChangeSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  const previousStatus = data.previousStatus || 'previous status';
  const newStatus = data.newStatus || 'new status';
  
  return {
    message: `${greeting}Your case status has changed from ${previousStatus} to ${newStatus}. Login to view details. - Career Ireland`,
  };
}

/**
 * Get document uploaded SMS template
 */
function getDocumentUploadedSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  const documentType = data.documentType || 'document';
  
  return {
    message: `${greeting}A new ${documentType} has been uploaded to your case. Login to view. - Career Ireland`,
  };
}

/**
 * Get document validated SMS template
 */
function getDocumentValidatedSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  const documentType = data.documentType || 'document';
  
  return {
    message: `${greeting}Your ${documentType} has been validated successfully. - Career Ireland`,
  };
}

/**
 * Get document rejected SMS template
 */
function getDocumentRejectedSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  const documentType = data.documentType || 'document';
  
  return {
    message: `${greeting}Your ${documentType} has been rejected. Please login to view details and upload a new document. - Career Ireland`,
  };
}

/**
 * Get case assigned SMS template
 */
function getCaseAssignedSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  
  return {
    message: `${greeting}Your case has been assigned to an agent. Login to view details. - Career Ireland`,
  };
}

/**
 * Get case approved SMS template
 */
function getCaseApprovedSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  
  return {
    message: `${greeting}Congratulations! Your case has been approved. Login to view details. - Career Ireland`,
  };
}

/**
 * Get case rejected SMS template
 */
function getCaseRejectedSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  
  return {
    message: `${greeting}We regret to inform you that your case has been rejected. Please login to view details. - Career Ireland`,
  };
}

/**
 * Get action required SMS template
 */
function getActionRequiredSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  
  return {
    message: `${greeting}Action required on your case. Please login to view details. - Career Ireland`,
  };
}

/**
 * Get comment added SMS template
 */
function getCommentAddedSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  
  return {
    message: `${greeting}A new comment has been added to your case. Login to view. - Career Ireland`,
  };
}

/**
 * Get appointment scheduled SMS template
 */
function getAppointmentScheduledSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  const appointmentType = data.appointmentType || 'appointment';
  const appointmentDate = data.appointmentDate || 'scheduled date';
  
  return {
    message: `${greeting}Your ${appointmentType} has been scheduled for ${appointmentDate}. Login for details. - Career Ireland`,
  };
}

/**
 * Get appointment reminder SMS template
 */
function getAppointmentReminderSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  const appointmentType = data.appointmentType || 'appointment';
  const appointmentDate = data.appointmentDate || 'scheduled date';
  
  return {
    message: `${greeting}Reminder: Your ${appointmentType} is scheduled for ${appointmentDate}. - Career Ireland`,
  };
}

/**
 * Get appointment cancelled SMS template
 */
function getAppointmentCancelledSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  const appointmentType = data.appointmentType || 'appointment';
  
  return {
    message: `${greeting}Your ${appointmentType} has been cancelled. Please login for details. - Career Ireland`,
  };
}

/**
 * Get payment received SMS template
 */
function getPaymentReceivedSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  const paymentAmount = data.paymentAmount || 'payment';
  
  return {
    message: `${greeting}We have received your ${paymentAmount} payment. Thank you. - Career Ireland`,
  };
}

/**
 * Get payment due SMS template
 */
function getPaymentDueSmsTemplate(data: TemplateData): SmsTemplateContent {
  const greeting = data.firstName ? `Hi ${data.firstName}, ` : '';
  const paymentAmount = data.paymentAmount || 'payment';
  const dueDate = data.dueDate || 'due date';
  
  return {
    message: `${greeting}Payment reminder: ${paymentAmount} is due on ${dueDate}. Please login to make payment. - Career Ireland`,
  };
}
