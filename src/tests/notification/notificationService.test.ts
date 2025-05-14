/**
 * Notification Service Tests
 */
import { v4 as uuidv4 } from 'uuid';
import {
  createUserNotification,
  createCaseStatusNotification,
  createDocumentUploadNotification,
  getUserNotifications,
  markAsRead,
  scheduleUserNotification
} from '@/services/notification/notificationService';
import {
  getNotificationsByUserId,
  markNotificationAsRead
} from '@/services/notification/notificationRepository';
import { getCaseById } from '@/services/case/caseRepository';
import { getUserById } from '@/services/user/userRepository';
import { NotificationType } from '@/types/notification';
import { CaseStatus } from '@/types/case';
import { UserRole } from '@/types/user';
import { deliverNotification, scheduleNotification } from '@/services/notification/notificationDeliveryService';

// Mock the repositories and services
jest.mock('@/services/notification/notificationRepository');
jest.mock('@/services/case/caseRepository');
jest.mock('@/services/user/userRepository');
jest.mock('@/services/notification/notificationDeliveryService');

describe('Notification Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserNotification', () => {
    it('should create a notification for a user', async () => {
      // Mock data
      const userId = uuidv4();
      const type = NotificationType.CASE_STATUS_CHANGE;
      const title = 'Test Title';
      const message = 'Test Message';
      const entityId = uuidv4();
      const entityType = 'case';
      const link = '/cases/123';
      const metadata = { key: 'value' };

      const mockNotification = {
        id: expect.any(String),
        userId,
        type,
        title,
        message,
        isRead: false,
        entityId,
        entityType,
        link,
        createdAt: expect.any(Date),
      };

      // Set up mock implementation
      (deliverNotification as jest.Mock).mockResolvedValue({
        inApp: true,
        email: false,
        sms: false,
        notification: mockNotification
      });

      // Call the function
      const result = await createUserNotification(
        userId,
        type,
        title,
        message,
        entityId,
        entityType,
        link,
        metadata
      );

      // Check that the delivery service was called with the correct parameters
      expect(deliverNotification).toHaveBeenCalledWith({
        userId,
        type,
        title,
        message,
        entityId,
        entityType,
        link,
        metadata
      });

      // Check the result
      expect(result).toEqual(mockNotification);
    });
  });

  describe('scheduleUserNotification', () => {
    it('should schedule a notification for future delivery', async () => {
      // Mock data
      const userId = uuidv4();
      const type = NotificationType.APPOINTMENT_REMINDER;
      const title = 'Appointment Reminder';
      const message = 'Your appointment is tomorrow';
      const deliveryDate = new Date(Date.now() + 86400000); // 1 day in the future
      const entityId = uuidv4();
      const entityType = 'appointment';
      const link = '/appointments/123';
      const metadata = { appointmentId: '123' };

      // Set up mock implementation
      (scheduleNotification as jest.Mock).mockResolvedValue('scheduled-id');

      // Call the function
      const result = await scheduleUserNotification(
        userId,
        type,
        title,
        message,
        deliveryDate,
        entityId,
        entityType,
        link,
        metadata
      );

      // Check that the delivery service was called with the correct parameters
      expect(scheduleNotification).toHaveBeenCalledWith(
        {
          userId,
          type,
          title,
          message,
          entityId,
          entityType,
          link,
          metadata
        },
        deliveryDate
      );

      // Check the result
      expect(result).toBe('scheduled-id');
    });
  });

  describe('createCaseStatusNotification', () => {
    it('should create notifications for case status change', async () => {
      // Mock data
      const caseId = uuidv4();
      const applicantId = uuidv4();
      const agentId = uuidv4();
      const previousStatus = CaseStatus.DRAFT;
      const newStatus = CaseStatus.SUBMITTED;

      const mockCase = {
        id: caseId,
        applicantId,
        agentId,
        status: newStatus,
      };

      const mockNotification = {
        id: expect.any(String),
        userId: applicantId,
        type: NotificationType.CASE_STATUS_CHANGE,
        title: 'Case Status Updated',
        message: expect.any(String),
        isRead: false,
        entityId: caseId,
        entityType: 'case',
        link: `/cases/${caseId}`,
        createdAt: expect.any(Date),
      };

      // Set up mock implementations
      (getCaseById as jest.Mock).mockResolvedValue(mockCase);
      (deliverNotification as jest.Mock).mockResolvedValue({
        inApp: true,
        email: false,
        sms: false,
        notification: mockNotification
      });

      // Call the function
      await createCaseStatusNotification(caseId, previousStatus, newStatus);

      // Check that the repository was called with the correct parameters
      expect(getCaseById).toHaveBeenCalledWith(caseId);

      // Check that notifications were created for both applicant and agent
      expect(deliverNotification).toHaveBeenCalledTimes(2);

      // Check applicant notification
      expect(deliverNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: applicantId,
          type: NotificationType.CASE_STATUS_CHANGE,
          title: 'Case Status Updated',
          entityId: caseId,
          entityType: 'case',
          metadata: expect.objectContaining({
            previousStatus,
            newStatus,
            caseId
          })
        })
      );

      // Check agent notification
      expect(deliverNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: agentId,
          type: NotificationType.CASE_STATUS_CHANGE,
          title: 'Case Status Updated',
          entityId: caseId,
          entityType: 'case',
          metadata: expect.objectContaining({
            previousStatus,
            newStatus,
            caseId
          })
        })
      );
    });

    it('should create additional notification for ADDITIONAL_INFO_REQUIRED status', async () => {
      // Mock data
      const caseId = uuidv4();
      const applicantId = uuidv4();
      const previousStatus = CaseStatus.IN_REVIEW;
      const newStatus = CaseStatus.ADDITIONAL_INFO_REQUIRED;

      const mockCase = {
        id: caseId,
        applicantId,
        agentId: null,
        status: newStatus,
      };

      const mockNotification = {
        id: expect.any(String),
        userId: applicantId,
        type: expect.any(String),
        title: expect.any(String),
        message: expect.any(String),
        isRead: false,
        entityId: caseId,
        entityType: 'case',
        link: `/cases/${caseId}`,
        createdAt: expect.any(Date),
      };

      // Set up mock implementations
      (getCaseById as jest.Mock).mockResolvedValue(mockCase);
      (deliverNotification as jest.Mock).mockResolvedValue({
        inApp: true,
        email: false,
        sms: false,
        notification: mockNotification
      });

      // Call the function
      await createCaseStatusNotification(caseId, previousStatus, newStatus);

      // Check that notifications were created (1 for status change, 1 for action required)
      expect(deliverNotification).toHaveBeenCalledTimes(2);

      // Check action required notification
      expect(deliverNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: applicantId,
          type: NotificationType.ACTION_REQUIRED,
          title: 'Action Required',
          entityId: caseId,
          entityType: 'case',
          metadata: expect.objectContaining({
            actionType: 'Additional Information',
            caseId
          })
        })
      );
    });
  });

  describe('createDocumentUploadNotification', () => {
    it('should create notification for agent when applicant uploads document', async () => {
      // Mock data
      const documentId = uuidv4();
      const caseId = uuidv4();
      const applicantId = uuidv4();
      const agentId = uuidv4();
      const documentType = 'passport';

      const mockCase = {
        id: caseId,
        applicantId,
        agentId,
      };

      const mockUser = {
        id: applicantId,
        role: UserRole.APPLICANT,
        firstName: 'Test',
        lastName: 'User',
      };

      const mockNotification = {
        id: expect.any(String),
        userId: agentId,
        type: NotificationType.DOCUMENT_UPLOADED,
        title: 'New Document Uploaded',
        message: expect.any(String),
        isRead: false,
        entityId: documentId,
        entityType: 'document',
        link: expect.any(String),
        createdAt: expect.any(Date),
      };

      // Set up mock implementations
      (getCaseById as jest.Mock).mockResolvedValue(mockCase);
      (getUserById as jest.Mock).mockResolvedValue(mockUser);
      (deliverNotification as jest.Mock).mockResolvedValue({
        inApp: true,
        email: false,
        sms: false,
        notification: mockNotification
      });

      // Call the function
      await createDocumentUploadNotification(documentId, caseId, applicantId, documentType);

      // Check that the repositories were called with the correct parameters
      expect(getCaseById).toHaveBeenCalledWith(caseId);
      expect(getUserById).toHaveBeenCalledWith(applicantId);

      // Check that notification was created for agent
      expect(deliverNotification).toHaveBeenCalledTimes(1);
      expect(deliverNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: agentId,
          type: NotificationType.DOCUMENT_UPLOADED,
          title: 'New Document Uploaded',
          entityId: documentId,
          entityType: 'document',
          metadata: expect.objectContaining({
            documentType,
            caseId,
            uploadedBy: 'Test User'
          })
        })
      );
    });

    it('should create notification for applicant when agent uploads document', async () => {
      // Mock data
      const documentId = uuidv4();
      const caseId = uuidv4();
      const applicantId = uuidv4();
      const agentId = uuidv4();
      const documentType = 'passport';

      const mockCase = {
        id: caseId,
        applicantId,
        agentId,
      };

      const mockUser = {
        id: agentId,
        role: UserRole.AGENT,
        firstName: 'Agent',
        lastName: 'User',
      };

      const mockNotification = {
        id: expect.any(String),
        userId: applicantId,
        type: NotificationType.DOCUMENT_UPLOADED,
        title: 'New Document Uploaded',
        message: expect.any(String),
        isRead: false,
        entityId: documentId,
        entityType: 'document',
        link: expect.any(String),
        createdAt: expect.any(Date),
      };

      // Set up mock implementations
      (getCaseById as jest.Mock).mockResolvedValue(mockCase);
      (getUserById as jest.Mock).mockResolvedValue(mockUser);
      (deliverNotification as jest.Mock).mockResolvedValue({
        inApp: true,
        email: false,
        sms: false,
        notification: mockNotification
      });

      // Call the function
      await createDocumentUploadNotification(documentId, caseId, agentId, documentType);

      // Check that notification was created for applicant
      expect(deliverNotification).toHaveBeenCalledTimes(1);
      expect(deliverNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: applicantId,
          type: NotificationType.DOCUMENT_UPLOADED,
          title: 'New Document Uploaded',
          entityId: documentId,
          entityType: 'document',
          metadata: expect.objectContaining({
            documentType,
            caseId,
            uploadedBy: 'Agent User'
          })
        })
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should get notifications for a user', async () => {
      // Mock data
      const userId = uuidv4();
      const mockNotifications = [
        {
          id: uuidv4(),
          userId,
          type: NotificationType.CASE_STATUS_CHANGE,
          title: 'Test Title 1',
          message: 'Test Message 1',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          userId,
          type: NotificationType.DOCUMENT_UPLOADED,
          title: 'Test Title 2',
          message: 'Test Message 2',
          isRead: true,
          createdAt: new Date(),
        },
      ];

      // Set up mock implementation
      (getNotificationsByUserId as jest.Mock).mockResolvedValue(mockNotifications);

      // Call the function
      const result = await getUserNotifications(userId);

      // Check that the repository was called with the correct parameters
      expect(getNotificationsByUserId).toHaveBeenCalledWith(userId);

      // Check the result
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      // Mock data
      const notificationId = uuidv4();
      const mockNotification = {
        id: notificationId,
        userId: uuidv4(),
        type: NotificationType.CASE_STATUS_CHANGE,
        title: 'Test Title',
        message: 'Test Message',
        isRead: true,
        createdAt: new Date(),
      };

      // Set up mock implementation
      (markNotificationAsRead as jest.Mock).mockResolvedValue(mockNotification);

      // Call the function
      const result = await markAsRead(notificationId);

      // Check that the repository was called with the correct parameters
      expect(markNotificationAsRead).toHaveBeenCalledWith(notificationId);

      // Check the result
      expect(result).toEqual(mockNotification);
    });
  });
});
