/**
 * Notification Delivery Service Tests
 */
import { deliverNotification, scheduleNotification } from '@/services/notification/notificationDeliveryService';
import { getUserNotificationPreferences } from '@/services/notification/notificationPreferenceRepository';
import { createNotification } from '@/services/notification/notificationRepository';
import { sendNotificationEmail } from '@/services/notification/emailService';
import { sendNotificationSms } from '@/services/notification/smsService';
import { NotificationType } from '@/types/notification';

// Mock dependencies
jest.mock('@/services/notification/notificationPreferenceRepository');
jest.mock('@/services/notification/notificationRepository');
jest.mock('@/services/notification/emailService');
jest.mock('@/services/notification/smsService');

describe('Notification Delivery Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('deliverNotification', () => {
    it('should deliver notification through all enabled channels', async () => {
      // Arrange
      const options = {
        userId: 'test-user-id',
        type: NotificationType.CASE_STATUS_CHANGE,
        title: 'Test Title',
        message: 'Test Message',
        entityId: 'test-entity-id',
        entityType: 'case',
        link: '/test-link',
        metadata: { key: 'value' },
      };

      // Mock getUserNotificationPreferences
      (getUserNotificationPreferences as jest.Mock).mockResolvedValueOnce({
        inApp: true,
        email: true,
        sms: true,
      });

      // Mock createNotification
      (createNotification as jest.Mock).mockResolvedValueOnce({
        id: 'test-notification-id',
        ...options,
        isRead: false,
        createdAt: new Date(),
      });

      // Mock sendNotificationEmail
      (sendNotificationEmail as jest.Mock).mockResolvedValueOnce(true);

      // Mock sendNotificationSms
      (sendNotificationSms as jest.Mock).mockResolvedValueOnce(true);

      // Act
      const result = await deliverNotification(options);

      // Assert
      expect(result).toEqual({
        inApp: true,
        email: true,
        sms: true,
        notification: expect.objectContaining({
          id: 'test-notification-id',
          userId: options.userId,
          type: options.type,
          title: options.title,
          message: options.message,
        }),
      });

      expect(getUserNotificationPreferences).toHaveBeenCalledWith(options.userId, options.type);
      expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
      }));
      expect(sendNotificationEmail).toHaveBeenCalledWith(
        options.userId,
        options.type,
        options.title,
        options.message,
        expect.objectContaining({
          entityId: options.entityId,
          entityType: options.entityType,
          link: options.link,
          key: 'value',
        })
      );
      expect(sendNotificationSms).toHaveBeenCalledWith(
        options.userId,
        options.type,
        options.title,
        options.message,
        expect.objectContaining({
          entityId: options.entityId,
          entityType: options.entityType,
          link: options.link,
          key: 'value',
        })
      );
    });

    it('should deliver notification only through enabled channels', async () => {
      // Arrange
      const options = {
        userId: 'test-user-id',
        type: NotificationType.CASE_STATUS_CHANGE,
        title: 'Test Title',
        message: 'Test Message',
      };

      // Mock getUserNotificationPreferences
      (getUserNotificationPreferences as jest.Mock).mockResolvedValueOnce({
        inApp: true,
        email: false,
        sms: false,
      });

      // Mock createNotification
      (createNotification as jest.Mock).mockResolvedValueOnce({
        id: 'test-notification-id',
        ...options,
        isRead: false,
        createdAt: new Date(),
      });

      // Act
      const result = await deliverNotification(options);

      // Assert
      expect(result).toEqual({
        inApp: true,
        email: false,
        sms: false,
        notification: expect.objectContaining({
          id: 'test-notification-id',
          userId: options.userId,
          type: options.type,
        }),
      });

      expect(getUserNotificationPreferences).toHaveBeenCalledWith(options.userId, options.type);
      expect(createNotification).toHaveBeenCalled();
      expect(sendNotificationEmail).not.toHaveBeenCalled();
      expect(sendNotificationSms).not.toHaveBeenCalled();
    });

    it('should handle errors during delivery', async () => {
      // Arrange
      const options = {
        userId: 'test-user-id',
        type: NotificationType.CASE_STATUS_CHANGE,
        title: 'Test Title',
        message: 'Test Message',
      };

      // Mock getUserNotificationPreferences to throw an error
      (getUserNotificationPreferences as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to get preferences')
      );

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(deliverNotification(options)).rejects.toThrow('Failed to get preferences');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error delivering notification:',
        expect.any(Error)
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('scheduleNotification', () => {
    it('should deliver notification immediately if delivery date is in the past', async () => {
      // Arrange
      const options = {
        userId: 'test-user-id',
        type: NotificationType.CASE_STATUS_CHANGE,
        title: 'Test Title',
        message: 'Test Message',
      };
      const deliveryDate = new Date(Date.now() - 1000); // 1 second in the past

      // Mock deliverNotification
      const deliverNotificationMock = jest.spyOn(
        require('@/services/notification/notificationDeliveryService'),
        'deliverNotification'
      );
      deliverNotificationMock.mockResolvedValueOnce({
        inApp: true,
        email: false,
        sms: false,
      });

      // Act
      const result = await scheduleNotification(options, deliveryDate);

      // Assert
      expect(result).toBe('immediate');
      expect(deliverNotificationMock).toHaveBeenCalledWith(options);
    });

    it('should schedule notification for future delivery', async () => {
      // Arrange
      const options = {
        userId: 'test-user-id',
        type: NotificationType.CASE_STATUS_CHANGE,
        title: 'Test Title',
        message: 'Test Message',
      };
      const deliveryDate = new Date(Date.now() + 60000); // 1 minute in the future

      // Mock UUID
      jest.mock('uuid', () => ({
        v4: jest.fn().mockReturnValue('test-scheduled-id'),
      }));

      // Mock deliverNotification
      const deliverNotificationMock = jest.spyOn(
        require('@/services/notification/notificationDeliveryService'),
        'deliverNotification'
      );
      deliverNotificationMock.mockResolvedValueOnce({
        inApp: true,
        email: false,
        sms: false,
      });

      // Mock console.log to prevent test output pollution
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await scheduleNotification(options, deliveryDate);

      // Fast-forward time
      jest.advanceTimersByTime(60000);

      // Assert
      expect(result).not.toBe('immediate');
      expect(deliverNotificationMock).not.toHaveBeenCalled(); // Not called immediately

      // Restore console.log
      consoleLogSpy.mockRestore();
    });
  });
});
