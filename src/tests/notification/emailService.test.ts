/**
 * Email Service Tests
 */
import { sendEmail, sendNotificationEmail } from '@/services/notification/emailService';
import { NotificationType } from '@/types/notification';
import { getUserById } from '@/services/user/userRepository';
import { getEmailTemplate } from '@/services/notification/templates/emailTemplates';

// Mock dependencies
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockImplementation((mailOptions) => {
      return Promise.resolve({
        messageId: 'test-message-id',
      });
    }),
  }),
}));

jest.mock('@/services/user/userRepository');
jest.mock('@/services/notification/templates/emailTemplates');

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      // Arrange
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      };

      // Act
      const result = await sendEmail(emailOptions);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle errors when sending email', async () => {
      // Arrange
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      };

      // Mock nodemailer to throw an error
      const nodemailer = require('nodemailer');
      nodemailer.createTransport.mockReturnValueOnce({
        sendMail: jest.fn().mockRejectedValueOnce(new Error('Failed to send email')),
      });

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await sendEmail(emailOptions);

      // Assert
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending email:',
        expect.any(Error)
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendNotificationEmail', () => {
    it('should send a notification email successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const type = NotificationType.CASE_STATUS_CHANGE;
      const title = 'Test Title';
      const message = 'Test Message';
      const data = { key: 'value' };

      // Mock getUserById
      (getUserById as jest.Mock).mockResolvedValueOnce({
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      // Mock getEmailTemplate
      (getEmailTemplate as jest.Mock).mockReturnValueOnce({
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      });

      // Act
      const result = await sendNotificationEmail(userId, type, title, message, data);

      // Assert
      expect(result).toBe(true);
      expect(getUserById).toHaveBeenCalledWith(userId);
      expect(getEmailTemplate).toHaveBeenCalledWith(type, {
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
      const result = await sendNotificationEmail(userId, type, title, message);

      // Assert
      expect(result).toBe(false);
      expect(getUserById).toHaveBeenCalledWith(userId);
      expect(getEmailTemplate).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cannot send email: User not found or has no email'
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should handle user with no email', async () => {
      // Arrange
      const userId = 'test-user-id';
      const type = NotificationType.CASE_STATUS_CHANGE;
      const title = 'Test Title';
      const message = 'Test Message';

      // Mock getUserById to return a user with no email
      (getUserById as jest.Mock).mockResolvedValueOnce({
        id: userId,
        email: null,
        firstName: 'Test',
        lastName: 'User',
      });

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await sendNotificationEmail(userId, type, title, message);

      // Assert
      expect(result).toBe(false);
      expect(getUserById).toHaveBeenCalledWith(userId);
      expect(getEmailTemplate).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cannot send email: User not found or has no email'
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
