/**
 * SMS Notification Service
 * 
 * Handles sending SMS notifications using a configured SMS provider.
 * Currently supports sending via:
 * - Twilio
 * 
 * Can be extended to support other providers like:
 * - AWS SNS
 * - Nexmo/Vonage
 * - MessageBird
 */
import { Twilio } from 'twilio';
import config from '@/lib/config';
import { NotificationType } from '@/types/notification';
import { getSmsTemplate } from './templates/smsTemplates';
import { getUserById } from '@/services/user/userRepository';

// SMS configuration
interface SmsConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  provider: 'twilio' | 'aws-sns' | 'nexmo';
}

// SMS content
interface SmsContent {
  message: string;
}

// SMS options
interface SmsOptions {
  to: string;
  message: string;
  from?: string;
}

/**
 * Create SMS client based on configuration
 */
function createSmsClient() {
  const smsConfig = config.sms;
  
  if (!smsConfig || !smsConfig.accountSid || !smsConfig.authToken) {
    throw new Error('SMS configuration is missing or incomplete');
  }
  
  if (smsConfig.provider === 'twilio') {
    return new Twilio(smsConfig.accountSid, smsConfig.authToken);
  }
  
  throw new Error(`Unsupported SMS provider: ${smsConfig.provider}`);
}

/**
 * Send an SMS
 */
export async function sendSms(options: SmsOptions): Promise<boolean> {
  try {
    const smsConfig = config.sms;
    
    if (!smsConfig || !smsConfig.provider) {
      console.error('SMS configuration is missing');
      return false;
    }
    
    if (smsConfig.provider === 'twilio') {
      return await sendTwilioSms(options);
    }
    
    console.error(`Unsupported SMS provider: ${smsConfig.provider}`);
    return false;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

/**
 * Send SMS via Twilio
 */
async function sendTwilioSms(options: SmsOptions): Promise<boolean> {
  try {
    const client = createSmsClient() as Twilio;
    const smsConfig = config.sms;
    
    const message = await client.messages.create({
      body: options.message,
      from: options.from || smsConfig.fromNumber,
      to: options.to,
    });
    
    console.log('SMS sent:', message.sid);
    return true;
  } catch (error) {
    console.error('Error sending Twilio SMS:', error);
    return false;
  }
}

/**
 * Send a notification SMS to a user
 */
export async function sendNotificationSms(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    // Get user
    const user = await getUserById(userId);
    
    if (!user || !user.phoneNumber) {
      console.error('Cannot send SMS: User not found or has no phone number');
      return false;
    }
    
    // Get SMS template
    const template = getSmsTemplate(type, {
      title,
      message,
      firstName: user.firstName,
      lastName: user.lastName,
      ...data,
    });
    
    // Send SMS
    return await sendSms({
      to: user.phoneNumber,
      message: template.message,
    });
  } catch (error) {
    console.error('Error sending notification SMS:', error);
    return false;
  }
}

/**
 * Send a test SMS
 */
export async function sendTestSms(phoneNumber: string): Promise<boolean> {
  try {
    return await sendSms({
      to: phoneNumber,
      message: 'This is a test SMS from Career Ireland Immigration SaaS.',
    });
  } catch (error) {
    console.error('Error sending test SMS:', error);
    return false;
  }
}

export default {
  sendSms,
  sendNotificationSms,
  sendTestSms,
};
