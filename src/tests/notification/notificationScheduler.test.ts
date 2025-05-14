/**
 * Notification Scheduler Tests
 */
import {
  scheduleNotification,
  cancelScheduledNotification,
  getScheduledNotifications,
  processScheduledNotifications,
} from '@/services/notification/notificationScheduler';
import { createNotification } from '@/services/notification/notificationService';
import db from '@/lib/db';
import { NotificationType } from '@/types/notification';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/services/notification/notificationService', () => ({
  createNotification: jest.fn(),
}));

describe('Notification Scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleNotification', () => {
    it('should schedule a notification successfully', async () => {
      // Mock data
      const userId = 'user-123';
      const type = NotificationType.CASE_STATUS_CHANGE;
      const title = 'Test Title';
      const message = 'Test Message';
      const scheduledAt = new Date(Date.now() + 3600000); // 1 hour from now
      const data = { caseId: '123' };

      // Mock database response
      const mockRow = {
        id: 'scheduled-notification-123',
        user_id: userId,
        notification_type: type,
        title,
        message,
        scheduled_at: scheduledAt,
        data: JSON.stringify(data),
        created_at: new Date(),
      };
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockRow],
      });

      // Call the function
      const result = await scheduleNotification(userId, type, title, message, scheduledAt, data);

      // Check database query
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO scheduled_notifications'),
        [userId, type, title, message, scheduledAt, JSON.stringify(data)]
      );

      // Check result
      expect(result).toEqual({
        id: 'scheduled-notification-123',
        userId,
        type,
        title,
        message,
        scheduledAt,
        data,
        createdAt: expect.any(Date),
      });
    });

    it('should handle database errors', async () => {
      // Mock data
      const userId = 'user-123';
      const type = NotificationType.CASE_STATUS_CHANGE;
      const title = 'Test Title';
      const message = 'Test Message';
      const scheduledAt = new Date(Date.now() + 3600000); // 1 hour from now

      // Mock database error
      (db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Call the function
      await expect(scheduleNotification(userId, type, title, message, scheduledAt)).rejects.toThrow(
        'Failed to schedule notification'
      );

      // Check console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cancelScheduledNotification', () => {
    it('should cancel a scheduled notification successfully', async () => {
      // Mock data
      const notificationId = 'scheduled-notification-123';

      // Mock database response
      (db.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 1,
      });

      // Call the function
      const result = await cancelScheduledNotification(notificationId);

      // Check database query
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM scheduled_notifications'),
        [notificationId]
      );

      // Check result
      expect(result).toBe(true);
    });

    it('should return false if notification not found', async () => {
      // Mock data
      const notificationId = 'non-existent-id';

      // Mock database response
      (db.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 0,
      });

      // Call the function
      const result = await cancelScheduledNotification(notificationId);

      // Check database query
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM scheduled_notifications'),
        [notificationId]
      );

      // Check result
      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      // Mock data
      const notificationId = 'scheduled-notification-123';

      // Mock database error
      (db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Call the function
      await expect(cancelScheduledNotification(notificationId)).rejects.toThrow(
        'Failed to cancel scheduled notification'
      );

      // Check console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getScheduledNotifications', () => {
    it('should get all scheduled notifications for a user', async () => {
      // Mock data
      const userId = 'user-123';

      // Mock database response
      const mockRows = [
        {
          id: 'scheduled-notification-1',
          user_id: userId,
          notification_type: NotificationType.CASE_STATUS_CHANGE,
          title: 'Test Title 1',
          message: 'Test Message 1',
          scheduled_at: new Date(Date.now() + 3600000),
          data: JSON.stringify({ caseId: '123' }),
          created_at: new Date(),
        },
        {
          id: 'scheduled-notification-2',
          user_id: userId,
          notification_type: NotificationType.DOCUMENT_UPLOADED,
          title: 'Test Title 2',
          message: 'Test Message 2',
          scheduled_at: new Date(Date.now() + 7200000),
          data: JSON.stringify({ documentId: '456' }),
          created_at: new Date(),
        },
      ];
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockRows,
      });

      // Call the function
      const result = await getScheduledNotifications(userId);

      // Check database query
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM scheduled_notifications'),
        [userId]
      );

      // Check result
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'scheduled-notification-1',
        userId,
        type: NotificationType.CASE_STATUS_CHANGE,
        title: 'Test Title 1',
        message: 'Test Message 1',
        scheduledAt: expect.any(Date),
        data: { caseId: '123' },
        createdAt: expect.any(Date),
      });
    });

    it('should handle database errors', async () => {
      // Mock data
      const userId = 'user-123';

      // Mock database error
      (db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Call the function
      await expect(getScheduledNotifications(userId)).rejects.toThrow(
        'Failed to get scheduled notifications'
      );

      // Check console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('processScheduledNotifications', () => {
    it('should process due notifications', async () => {
      // Mock current time
      const now = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => now as unknown as string);

      // Mock database response for due notifications
      const mockRows = [
        {
          id: 'scheduled-notification-1',
          user_id: 'user-123',
          notification_type: NotificationType.CASE_STATUS_CHANGE,
          title: 'Test Title 1',
          message: 'Test Message 1',
          scheduled_at: new Date(now.getTime() - 60000), // 1 minute ago
          data: JSON.stringify({ caseId: '123' }),
          created_at: new Date(now.getTime() - 3600000),
        },
        {
          id: 'scheduled-notification-2',
          user_id: 'user-456',
          notification_type: NotificationType.DOCUMENT_UPLOADED,
          title: 'Test Title 2',
          message: 'Test Message 2',
          scheduled_at: new Date(now.getTime() - 120000), // 2 minutes ago
          data: JSON.stringify({ documentId: '456' }),
          created_at: new Date(now.getTime() - 7200000),
        },
      ];
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockRows,
      });

      // Mock successful notification creation
      (createNotification as jest.Mock).mockResolvedValue(true);

      // Mock successful deletion of processed notifications
      (db.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 2,
      });

      // Call the function
      const result = await processScheduledNotifications();

      // Check database queries
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM scheduled_notifications'),
        [now]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM scheduled_notifications'),
        [['scheduled-notification-1', 'scheduled-notification-2']]
      );

      // Check notification creation calls
      expect(createNotification).toHaveBeenCalledTimes(2);
      expect(createNotification).toHaveBeenCalledWith(
        'user-123',
        NotificationType.CASE_STATUS_CHANGE,
        'Test Title 1',
        'Test Message 1',
        { caseId: '123' }
      );
      expect(createNotification).toHaveBeenCalledWith(
        'user-456',
        NotificationType.DOCUMENT_UPLOADED,
        'Test Title 2',
        'Test Message 2',
        { documentId: '456' }
      );

      // Check result
      expect(result).toBe(2);
    });

    it('should handle no due notifications', async () => {
      // Mock database response for no due notifications
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      // Call the function
      const result = await processScheduledNotifications();

      // Check result
      expect(result).toBe(0);
      expect(createNotification).not.toHaveBeenCalled();
    });

    it('should handle errors during processing', async () => {
      // Mock database response for due notifications
      const mockRows = [
        {
          id: 'scheduled-notification-1',
          user_id: 'user-123',
          notification_type: NotificationType.CASE_STATUS_CHANGE,
          title: 'Test Title 1',
          message: 'Test Message 1',
          scheduled_at: new Date(Date.now() - 60000), // 1 minute ago
          data: JSON.stringify({ caseId: '123' }),
          created_at: new Date(Date.now() - 3600000),
        },
      ];
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockRows,
      });

      // Mock error during notification creation
      (createNotification as jest.Mock).mockRejectedValue(new Error('Failed to create notification'));

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Call the function
      const result = await processScheduledNotifications();

      // Check result
      expect(result).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
