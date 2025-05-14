/**
 * Notification Preference Repository Tests
 */
import { v4 as uuidv4 } from 'uuid';
import {
  getAllUserNotificationPreferences,
  getUserNotificationPreference,
  getUserNotificationPreferences,
  setUserNotificationPreference,
  updateUserNotificationPreferences
} from '@/services/notification/notificationPreferenceRepository';
import db from '@/lib/db';
import { NotificationType } from '@/types/notification';

// Mock the database
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

describe('Notification Preference Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUserNotificationPreferences', () => {
    it('should return all notification preferences for a user', async () => {
      // Mock data
      const userId = uuidv4();
      const mockRows = [
        {
          id: 1,
          user_id: userId,
          notification_type: NotificationType.CASE_STATUS_CHANGE,
          in_app: true,
          email: true,
          sms: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          user_id: userId,
          notification_type: NotificationType.DOCUMENT_UPLOADED,
          in_app: true,
          email: false,
          sms: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Set up mock implementation
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockRows,
      });

      // Call the function
      const result = await getAllUserNotificationPreferences(userId);

      // Check that the database was queried with the correct parameters
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notification_preferences'),
        [userId]
      );

      // Check the result
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        userId,
        type: NotificationType.CASE_STATUS_CHANGE,
        inApp: true,
        email: true,
        sms: false,
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        userId,
        type: NotificationType.DOCUMENT_UPLOADED,
        inApp: true,
        email: false,
        sms: false,
      }));
    });
  });

  describe('getUserNotificationPreference', () => {
    it('should return a specific notification preference', async () => {
      // Mock data
      const userId = uuidv4();
      const type = NotificationType.CASE_STATUS_CHANGE;
      const mockRow = {
        id: 1,
        user_id: userId,
        notification_type: type,
        in_app: true,
        email: true,
        sms: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Set up mock implementation
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockRow],
      });

      // Call the function
      const result = await getUserNotificationPreference(userId, type);

      // Check that the database was queried with the correct parameters
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notification_preferences'),
        [userId, type]
      );

      // Check the result
      expect(result).toEqual(expect.objectContaining({
        userId,
        type,
        inApp: true,
        email: true,
        sms: false,
      }));
    });

    it('should return null if preference not found', async () => {
      // Mock data
      const userId = uuidv4();
      const type = NotificationType.CASE_STATUS_CHANGE;

      // Set up mock implementation
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      // Call the function
      const result = await getUserNotificationPreference(userId, type);

      // Check that the database was queried with the correct parameters
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notification_preferences'),
        [userId, type]
      );

      // Check the result
      expect(result).toBeNull();
    });
  });

  describe('getUserNotificationPreferences', () => {
    it('should return preferences with defaults if not found', async () => {
      // Mock data
      const userId = uuidv4();
      const type = NotificationType.CASE_STATUS_CHANGE;

      // Set up mock implementation
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      // Call the function
      const result = await getUserNotificationPreferences(userId, type);

      // Check that the database was queried with the correct parameters
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notification_preferences'),
        [userId, type]
      );

      // Check the result
      expect(result).toEqual({
        inApp: true,
        email: false,
        sms: false,
      });
    });

    it('should return preferences from database if found', async () => {
      // Mock data
      const userId = uuidv4();
      const type = NotificationType.CASE_STATUS_CHANGE;
      const mockRow = {
        id: 1,
        user_id: userId,
        notification_type: type,
        in_app: true,
        email: true,
        sms: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Set up mock implementation
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockRow],
      });

      // Call the function
      const result = await getUserNotificationPreferences(userId, type);

      // Check the result
      expect(result).toEqual({
        inApp: true,
        email: true,
        sms: true,
      });
    });

    it('should return default email preferences for important notifications', async () => {
      // Mock data
      const userId = uuidv4();
      const type = NotificationType.CASE_APPROVED;

      // Set up mock implementation
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      // Call the function
      const result = await getUserNotificationPreferences(userId, type);

      // Check the result
      expect(result).toEqual({
        inApp: true,
        email: true,
        sms: false,
      });
    });
  });

  describe('setUserNotificationPreference', () => {
    it('should update existing preference', async () => {
      // Mock data
      const userId = uuidv4();
      const type = NotificationType.CASE_STATUS_CHANGE;
      const inApp = true;
      const email = true;
      const sms = true;
      const mockRow = {
        id: 1,
        user_id: userId,
        notification_type: type,
        in_app: inApp,
        email: email,
        sms: sms,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Set up mock implementation
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockRow],
      }).mockResolvedValueOnce({
        rows: [mockRow],
      });

      // Call the function
      const result = await setUserNotificationPreference(userId, type, inApp, email, sms);

      // Check that the database was queried with the correct parameters
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notification_preferences'),
        [userId, type, inApp, email, sms]
      );

      // Check the result
      expect(result).toEqual(expect.objectContaining({
        userId,
        type,
        inApp,
        email,
        sms,
      }));
    });

    it('should create new preference if not exists', async () => {
      // Mock data
      const userId = uuidv4();
      const type = NotificationType.CASE_STATUS_CHANGE;
      const inApp = true;
      const email = true;
      const sms = true;
      const mockRow = {
        id: 1,
        user_id: userId,
        notification_type: type,
        in_app: inApp,
        email: email,
        sms: sms,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Set up mock implementation
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      }).mockResolvedValueOnce({
        rows: [mockRow],
      });

      // Call the function
      const result = await setUserNotificationPreference(userId, type, inApp, email, sms);

      // Check that the database was queried with the correct parameters
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_preferences'),
        [userId, type, inApp, email, sms]
      );

      // Check the result
      expect(result).toEqual(expect.objectContaining({
        userId,
        type,
        inApp,
        email,
        sms,
      }));
    });
  });
});
