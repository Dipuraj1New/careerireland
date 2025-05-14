/**
 * Email Notification Service
 * 
 * Handles sending email notifications using a configured email provider.
 * Currently supports sending via:
 * - NodeMailer with SMTP
 * 
 * Can be extended to support other providers like:
 * - SendGrid
 * - Mailgun
 * - AWS SES
 */
import nodemailer from 'nodemailer';
import config from '@/lib/config';
import { User } from '@/types/user';
import { NotificationType } from '@/types/notification';
import { getEmailTemplate } from './templates/emailTemplates';
import { getUserById } from '@/services/user/userRepository';

// Email configuration
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// Email content
interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

// Email options
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}

/**
 * Create email transporter based on configuration
 */
function createTransporter() {
  const emailConfig = config.email;
  
  if (!emailConfig || !emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
    throw new Error('Email configuration is missing or incomplete');
  }
  
  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.auth.user,
      pass: emailConfig.auth.pass,
    },
  });
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const emailConfig = config.email;
    
    const mailOptions = {
      from: options.from || emailConfig.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a notification email to a user
 */
export async function sendNotificationEmail(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    // Get user
    const user = await getUserById(userId);
    
    if (!user || !user.email) {
      console.error('Cannot send email: User not found or has no email');
      return false;
    }
    
    // Get email template
    const template = getEmailTemplate(type, {
      title,
      message,
      firstName: user.firstName,
      lastName: user.lastName,
      ...data,
    });
    
    // Send email
    return await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}

/**
 * Send a test email
 */
export async function sendTestEmail(email: string): Promise<boolean> {
  try {
    return await sendEmail({
      to: email,
      subject: 'Test Email from Career Ireland',
      html: '<h1>Test Email</h1><p>This is a test email from Career Ireland Immigration SaaS.</p>',
      text: 'Test Email\n\nThis is a test email from Career Ireland Immigration SaaS.',
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
}

export default {
  sendEmail,
  sendNotificationEmail,
  sendTestEmail,
};
