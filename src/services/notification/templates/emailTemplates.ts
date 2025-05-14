/**
 * Email Templates
 * 
 * Provides templates for different types of notification emails.
 */
import { NotificationType } from '@/types/notification';

// Email template content
interface EmailTemplateContent {
  subject: string;
  html: string;
  text: string;
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
 * Get email template for a notification type
 */
export function getEmailTemplate(
  type: NotificationType,
  data: TemplateData
): EmailTemplateContent {
  switch (type) {
    case NotificationType.CASE_STATUS_CHANGE:
      return getCaseStatusChangeTemplate(data);
    case NotificationType.DOCUMENT_UPLOADED:
      return getDocumentUploadedTemplate(data);
    case NotificationType.DOCUMENT_VALIDATED:
      return getDocumentValidatedTemplate(data);
    case NotificationType.DOCUMENT_REJECTED:
      return getDocumentRejectedTemplate(data);
    case NotificationType.CASE_ASSIGNED:
      return getCaseAssignedTemplate(data);
    case NotificationType.CASE_APPROVED:
      return getCaseApprovedTemplate(data);
    case NotificationType.CASE_REJECTED:
      return getCaseRejectedTemplate(data);
    case NotificationType.ACTION_REQUIRED:
      return getActionRequiredTemplate(data);
    case NotificationType.COMMENT_ADDED:
      return getCommentAddedTemplate(data);
    case NotificationType.APPOINTMENT_SCHEDULED:
      return getAppointmentScheduledTemplate(data);
    case NotificationType.APPOINTMENT_REMINDER:
      return getAppointmentReminderTemplate(data);
    case NotificationType.APPOINTMENT_CANCELLED:
      return getAppointmentCancelledTemplate(data);
    case NotificationType.PAYMENT_RECEIVED:
      return getPaymentReceivedTemplate(data);
    case NotificationType.PAYMENT_DUE:
      return getPaymentDueTemplate(data);
    case NotificationType.SYSTEM:
    default:
      return getDefaultTemplate(data);
  }
}

/**
 * Get default email template
 */
function getDefaultTemplate(data: TemplateData): EmailTemplateContent {
  const greeting = data.firstName ? `Hello ${data.firstName},` : 'Hello,';
  
  return {
    subject: data.title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${data.title}</h2>
        <p>${greeting}</p>
        <p>${data.message}</p>
        <p>Thank you for using Career Ireland Immigration Services.</p>
        <p>
          <small style="color: #6b7280;">
            This is an automated message, please do not reply to this email.
          </small>
        </p>
      </div>
    `,
    text: `${data.title}\n\n${greeting}\n\n${data.message}\n\nThank you for using Career Ireland Immigration Services.\n\nThis is an automated message, please do not reply to this email.`,
  };
}

/**
 * Get case status change email template
 */
function getCaseStatusChangeTemplate(data: TemplateData): EmailTemplateContent {
  const greeting = data.firstName ? `Hello ${data.firstName},` : 'Hello,';
  const previousStatus = data.previousStatus || 'previous status';
  const newStatus = data.newStatus || 'new status';
  
  return {
    subject: `Case Status Updated: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Case Status Updated</h2>
        <p>${greeting}</p>
        <p>Your case status has been updated from <strong>${previousStatus}</strong> to <strong>${newStatus}</strong>.</p>
        <p>${data.message}</p>
        <p>
          <a href="${data.link || 'https://careerireland.com'}" style="background-color: #2563eb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">
            View Case Details
          </a>
        </p>
        <p>Thank you for using Career Ireland Immigration Services.</p>
        <p>
          <small style="color: #6b7280;">
            This is an automated message, please do not reply to this email.
          </small>
        </p>
      </div>
    `,
    text: `Case Status Updated: ${data.title}\n\n${greeting}\n\nYour case status has been updated from ${previousStatus} to ${newStatus}.\n\n${data.message}\n\nView Case Details: ${data.link || 'https://careerireland.com'}\n\nThank you for using Career Ireland Immigration Services.\n\nThis is an automated message, please do not reply to this email.`,
  };
}

/**
 * Get document uploaded email template
 */
function getDocumentUploadedTemplate(data: TemplateData): EmailTemplateContent {
  const greeting = data.firstName ? `Hello ${data.firstName},` : 'Hello,';
  const documentType = data.documentType || 'document';
  
  return {
    subject: `Document Uploaded: ${documentType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Document Uploaded</h2>
        <p>${greeting}</p>
        <p>A new ${documentType} has been uploaded to your case.</p>
        <p>${data.message}</p>
        <p>
          <a href="${data.link || 'https://careerireland.com'}" style="background-color: #2563eb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">
            View Document
          </a>
        </p>
        <p>Thank you for using Career Ireland Immigration Services.</p>
        <p>
          <small style="color: #6b7280;">
            This is an automated message, please do not reply to this email.
          </small>
        </p>
      </div>
    `,
    text: `Document Uploaded: ${documentType}\n\n${greeting}\n\nA new ${documentType} has been uploaded to your case.\n\n${data.message}\n\nView Document: ${data.link || 'https://careerireland.com'}\n\nThank you for using Career Ireland Immigration Services.\n\nThis is an automated message, please do not reply to this email.`,
  };
}

// Additional template functions for other notification types
function getDocumentValidatedTemplate(data: TemplateData): EmailTemplateContent {
  // Implementation similar to other templates
  return getDefaultTemplate({
    ...data,
    title: `Document Validated: ${data.documentType || 'Document'}`,
  });
}

function getDocumentRejectedTemplate(data: TemplateData): EmailTemplateContent {
  // Implementation similar to other templates
  return getDefaultTemplate({
    ...data,
    title: `Document Rejected: ${data.documentType || 'Document'}`,
  });
}

function getCaseAssignedTemplate(data: TemplateData): EmailTemplateContent {
  // Implementation similar to other templates
  return getDefaultTemplate({
    ...data,
    title: `Case Assigned: ${data.caseId || 'Your Case'}`,
  });
}

function getCaseApprovedTemplate(data: TemplateData): EmailTemplateContent {
  // Implementation similar to other templates
  return getDefaultTemplate({
    ...data,
    title: `Case Approved: ${data.caseId || 'Your Case'}`,
  });
}

function getCaseRejectedTemplate(data: TemplateData): EmailTemplateContent {
  // Implementation similar to other templates
  return getDefaultTemplate({
    ...data,
    title: `Case Rejected: ${data.caseId || 'Your Case'}`,
  });
}

function getActionRequiredTemplate(data: TemplateData): EmailTemplateContent {
  // Implementation similar to other templates
  return getDefaultTemplate({
    ...data,
    title: `Action Required: ${data.actionType || 'Your Case'}`,
  });
}

function getCommentAddedTemplate(data: TemplateData): EmailTemplateContent {
  // Implementation similar to other templates
  return getDefaultTemplate({
    ...data,
    title: `New Comment: ${data.commentSource || 'Your Case'}`,
  });
}

function getAppointmentScheduledTemplate(data: TemplateData): EmailTemplateContent {
  // Implementation similar to other templates
  return getDefaultTemplate({
    ...data,
    title: `Appointment Scheduled: ${data.appointmentType || 'Consultation'}`,
  });
}

function getAppointmentReminderTemplate(data: TemplateData): EmailTemplateContent {
  // Implementation similar to other templates
  return getDefaultTemplate({
    ...data,
    title: `Appointment Reminder: ${data.appointmentType || 'Consultation'}`,
  });
}

function getAppointmentCancelledTemplate(data: TemplateData): EmailTemplateContent {
  // Implementation similar to other templates
  return getDefaultTemplate({
    ...data,
    title: `Appointment Cancelled: ${data.appointmentType || 'Consultation'}`,
  });
}

function getPaymentReceivedTemplate(data: TemplateData): EmailTemplateContent {
  // Implementation similar to other templates
  return getDefaultTemplate({
    ...data,
    title: `Payment Received: ${data.paymentAmount || 'Payment'}`,
  });
}

function getPaymentDueTemplate(data: TemplateData): EmailTemplateContent {
  // Implementation similar to other templates
  return getDefaultTemplate({
    ...data,
    title: `Payment Due: ${data.paymentAmount || 'Payment'}`,
  });
}
