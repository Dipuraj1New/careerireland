/**
 * Notification Preferences API Tests
 */
import { NextRequest, NextResponse } from 'next/server';
import { GET, PUT } from '@/app/api/notifications/preferences/route';
import { getUserFromRequest } from '@/lib/auth';
import db from '@/lib/db';
import { NotificationType } from '@/types/notification';

// Mock the dependencies
jest.mock('@/lib/auth', () => ({
  getUserFromRequest: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      json: jest.fn().mockImplementation((data, options) => ({
        data,
        options,
      })),
    },
  };
});

describe('Notification Preferences API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications/preferences', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock user authentication
      (getUserFromRequest as jest.Mock).mockResolvedValueOnce(null);

      // Create mock request
      const request = new NextRequest('http://localhost/api/notifications/preferences');

      // Call the handler
      const response = await GET(request);

      // Check the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    });

    it('should return default preferences if none exist', async () => {
      // Mock user authentication
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      (getUserFromRequest as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock database query
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      // Create mock request
      const request = new NextRequest('http://localhost/api/notifications/preferences');

      // Call the handler
      const response = await GET(request);

      // Check the database query
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notification_preferences'),
        [mockUser.id]
      );

      // Check the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          preferences: expect.arrayContaining([
            expect.objectContaining({
              type: expect.any(String),
              inApp: expect.any(Boolean),
              email: expect.any(Boolean),
              sms: expect.any(Boolean),
            }),
          ]),
        },
        { status: 200 }
      );
    });

    it('should return user preferences if they exist', async () => {
      // Mock user authentication
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      (getUserFromRequest as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock database query
      const mockRows = [
        {
          notification_type: NotificationType.CASE_STATUS_CHANGE,
          in_app: true,
          email: true,
          sms: false,
        },
        {
          notification_type: NotificationType.DOCUMENT_UPLOADED,
          in_app: true,
          email: false,
          sms: false,
        },
      ];
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockRows,
      });

      // Create mock request
      const request = new NextRequest('http://localhost/api/notifications/preferences');

      // Call the handler
      const response = await GET(request);

      // Check the database query
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notification_preferences'),
        [mockUser.id]
      );

      // Check the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          preferences: [
            {
              type: NotificationType.CASE_STATUS_CHANGE,
              inApp: true,
              email: true,
              sms: false,
            },
            {
              type: NotificationType.DOCUMENT_UPLOADED,
              inApp: true,
              email: false,
              sms: false,
            },
          ],
        },
        { status: 200 }
      );
    });

    it('should handle errors', async () => {
      // Mock user authentication
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      (getUserFromRequest as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock database query to throw error
      (db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create mock request
      const request = new NextRequest('http://localhost/api/notifications/preferences');

      // Call the handler
      const response = await GET(request);

      // Check the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to get notification preferences' },
        { status: 500 }
      );

      // Check console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('PUT /api/notifications/preferences', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock user authentication
      (getUserFromRequest as jest.Mock).mockResolvedValueOnce(null);

      // Create mock request
      const request = new NextRequest('http://localhost/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          preferences: [],
        }),
      });

      // Call the handler
      const response = await PUT(request);

      // Check the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    });

    it('should return 400 if preferences are invalid', async () => {
      // Mock user authentication
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      (getUserFromRequest as jest.Mock).mockResolvedValueOnce(mockUser);

      // Create mock request with invalid body
      const request = new NextRequest('http://localhost/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          // Missing preferences array
        }),
      });

      // Call the handler
      const response = await PUT(request);

      // Check the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Invalid preferences data' },
        { status: 400 }
      );
    });

    it('should update preferences successfully', async () => {
      // Mock user authentication
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      (getUserFromRequest as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock database queries
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // DELETE
        .mockResolvedValueOnce({ rows: [] }) // INSERT 1
        .mockResolvedValueOnce({ rows: [] }) // INSERT 2
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Create mock request
      const preferences = [
        {
          type: NotificationType.CASE_STATUS_CHANGE,
          inApp: true,
          email: true,
          sms: false,
        },
        {
          type: NotificationType.DOCUMENT_UPLOADED,
          inApp: true,
          email: false,
          sms: false,
        },
      ];
      const request = new NextRequest('http://localhost/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      });

      // Call the handler
      const response = await PUT(request);

      // Check the database queries
      expect(db.query).toHaveBeenCalledWith('BEGIN');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM notification_preferences'),
        [mockUser.id]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_preferences'),
        [
          mockUser.id,
          NotificationType.CASE_STATUS_CHANGE,
          true,
          true,
          false,
        ]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_preferences'),
        [
          mockUser.id,
          NotificationType.DOCUMENT_UPLOADED,
          true,
          false,
          false,
        ]
      );
      expect(db.query).toHaveBeenCalledWith('COMMIT');

      // Check the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: true },
        { status: 200 }
      );
    });

    it('should handle transaction errors', async () => {
      // Mock user authentication
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      (getUserFromRequest as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock database queries with error
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // DELETE

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create mock request
      const preferences = [
        {
          type: NotificationType.CASE_STATUS_CHANGE,
          inApp: true,
          email: true,
          sms: false,
        },
      ];
      const request = new NextRequest('http://localhost/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      });

      // Call the handler
      const response = await PUT(request);

      // Check the database queries
      expect(db.query).toHaveBeenCalledWith('BEGIN');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM notification_preferences'),
        [mockUser.id]
      );
      expect(db.query).toHaveBeenCalledWith('ROLLBACK');

      // Check the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to update notification preferences' },
        { status: 500 }
      );

      // Check console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
