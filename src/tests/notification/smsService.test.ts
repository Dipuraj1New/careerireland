/**
 * SMS Service Tests
 */
import { sendSms, sendNotificationSms } from '@/services/notification/smsService';
import { NotificationType } from '@/types/notification';
import { getUserById } from '@/services/user/userRepository';
import { getSmsTemplate } from '@/services/notification/templates/smsTemplates';

// Mock dependencies
jest.mock('twilio', () => {
  return {
    Twilio: jest.fn().mockImplementation(() => {
      return {
        messages: {
          create: jest.fn().mockResolvedValue({
            sid: 'test-message-sid',
          }),
        },
      };
    }),
  };
});

jest.mock('@/services/user/userRepository');
jest.mock('@/services/notification/templates/smsTemplates');

describe('SMS Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSms', () => {
    it('should send an SMS successfully', async () => {
      // Arrange
      const smsOptions = {
        to: '+1234567890',
        message: 'Test message',
      };

      // Act
      const result = await sendSms(smsOptions);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle errors when sending SMS', async () => {
      // Arrange
      const smsOptions = {
        to: '+1234567890',
        message: 'Test message',
      };

      // Mock Twilio to throw an error
      const twilio = require('twilio');
      twilio.Twilio.mockImplementationOnce(() => ({
        messages: {
          create: jest.fn().mockRejectedValueOnce(new Error('Failed to send SMS')),
        },
      }));

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await sendSms(smsOptions);

      // Assert
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending Twilio SMS:',
        expect.any(Error)
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendNotificationSms', () => {
    it('should send a notification SMS successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const type = NotificationType.CASE_STATUS_CHANGE;
      const title = 'Test Title';
      const message = 'Test Message';
      const data = { key: 'value' };

      // Mock getUserById
      (getUserById as jest.Mock).mockResolvedValueOnce({
        id: userId,
        phoneNumber: '+1234567890',
        firstName: 'Test',
        lastName: 'User',
      });

      // Mock getSmsTemplate
      (getSmsTemplate as jest.Mock).mockReturnValueOnce({
        message: 'Test SMS message',
      });

      // Act
      const result = await sendNotificationSms(userId, type, title, message, data);

      // Assert
      expect(result).toBe(true);
      expect(getUserById).toHaveBeenCalledWith(userId);
      expect(getSmsTemplate).toHaveBeenCalledWith(type, {
        title,
        message,
        firstName: 'Test',
        lastName: 'User',
        key: 'value',
      });
    });

    it('should handle user not found', async () => {
      // Arrange
      const userId = 'test-user-id';
      const type = NotificationType.CASE_STATUS_CHANGE;
      const title = 'Test Title';
      const message = 'Test Message';

      // Mock getUserById to return null
      (getUserById as jest.Mock).mockResolvedValueOnce(null);

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await sendNotificationSms(userId, type, title, message);

      // Assert
      expect(result).toBe(false);
      expect(getUserById).toHaveBeenCalledWith(userId);
      expect(getSmsTemplate).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cannot send SMS: User not found or has no phone number'
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should handle user with no phone number', async () => {
      // Arrange
      const userId = 'test-user-id';
      const type = NotificationType.CASE_STATUS_CHANGE;
      const title = 'Test Title';
      const message = 'Test Message';

      // Mock getUserById to return a user with no phone number
      (getUserById as jest.Mock).mockResolvedValueOnce({
        id: userId,
        phoneNumber: null,
        firstName: 'Test',
        lastName: 'User',
      });

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await sendNotificationSms(userId, type, title, message);

      // Assert
      expect(result).toBe(false);
      expect(getUserById).toHaveBeenCalledWith(userId);
      expect(getSmsTemplate).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cannot send SMS: User not found or has no phone number'
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
