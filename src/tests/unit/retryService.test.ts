/**
 * Unit tests for the retry service
 */
import * as retryService from '../../services/portal/retryService';
import * as portalRepository from '../../repositories/portalRepository';
import * as portalAutomationService from '../../services/portal/portalAutomationService';
import * as auditLogService from '../../services/auditLogService';
import * as notificationService from '../../services/notificationService';
import { 
  PortalSubmission, 
  PortalSubmissionStatus, 
  PortalSubmissionResult,
  GovernmentPortalType
} from '../../types/portal';

// Mock dependencies
jest.mock('../../repositories/portalRepository');
jest.mock('../../services/portal/portalAutomationService');
jest.mock('../../services/auditLogService');
jest.mock('../../services/notificationService');

describe('Retry Service', () => {
  // Mock data
  const mockUserId = 'user-123';
  const mockPortalSubmissionId = 'portal-submission-123';
  
  const mockPortalSubmission: PortalSubmission = {
    id: mockPortalSubmissionId,
    formSubmissionId: 'form-submission-123',
    portalType: GovernmentPortalType.IRISH_IMMIGRATION,
    status: PortalSubmissionStatus.FAILED,
    errorMessage: 'Network error occurred',
    retryCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock repository responses
    (portalRepository.getPortalSubmissionById as jest.Mock).mockResolvedValue(mockPortalSubmission);
    (portalRepository.updatePortalSubmission as jest.Mock).mockResolvedValue({
      ...mockPortalSubmission,
      status: PortalSubmissionStatus.RETRY_SCHEDULED,
      retryCount: 1,
    });
    
    // Mock automation service
    (portalAutomationService.submitFormToPortal as jest.Mock).mockResolvedValue({
      success: true,
      status: PortalSubmissionStatus.COMPLETED,
      confirmationNumber: 'CONF-123',
    });
    
    // Mock notification service
    (notificationService.sendNotification as jest.Mock).mockResolvedValue(undefined);
    
    // Mock audit log service
    (auditLogService.logEvent as jest.Mock).mockResolvedValue(undefined);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('handleFailedSubmission', () => {
    it('should schedule a retry for retryable errors', async () => {
      // Arrange
      const result: PortalSubmissionResult = {
        success: false,
        status: PortalSubmissionStatus.FAILED,
        errorMessage: 'Network error occurred',
      };
      
      // Act
      await retryService.handleFailedSubmission(mockPortalSubmissionId, mockUserId, result);
      
      // Assert
      expect(portalRepository.getPortalSubmissionById).toHaveBeenCalledWith(mockPortalSubmissionId);
      expect(portalRepository.updatePortalSubmission).toHaveBeenCalledWith(
        mockPortalSubmissionId,
        expect.objectContaining({
          status: PortalSubmissionStatus.RETRY_SCHEDULED,
          retryCount: 1,
          nextRetryAt: expect.any(Date),
        })
      );
      expect(auditLogService.logEvent).toHaveBeenCalled();
    });
    
    it('should not schedule a retry for non-retryable errors', async () => {
      // Arrange
      const result: PortalSubmissionResult = {
        success: false,
        status: PortalSubmissionStatus.FAILED,
        errorMessage: 'Invalid data: Missing required field',
      };
      
      // Act
      await retryService.handleFailedSubmission(mockPortalSubmissionId, mockUserId, result);
      
      // Assert
      expect(portalRepository.updatePortalSubmission).toHaveBeenCalledWith(
        mockPortalSubmissionId,
        expect.objectContaining({
          status: PortalSubmissionStatus.FAILED,
          errorMessage: 'Non-retryable error: Invalid data: Missing required field',
        })
      );
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });
    
    it('should not schedule a retry if maximum retry attempts reached', async () => {
      // Arrange
      const maxRetriesSubmission = {
        ...mockPortalSubmission,
        retryCount: 3, // Max retries
      };
      (portalRepository.getPortalSubmissionById as jest.Mock).mockResolvedValue(maxRetriesSubmission);
      
      const result: PortalSubmissionResult = {
        success: false,
        status: PortalSubmissionStatus.FAILED,
        errorMessage: 'Network error occurred',
      };
      
      // Act
      await retryService.handleFailedSubmission(mockPortalSubmissionId, mockUserId, result);
      
      // Assert
      expect(portalRepository.updatePortalSubmission).toHaveBeenCalledWith(
        mockPortalSubmissionId,
        expect.objectContaining({
          status: PortalSubmissionStatus.FAILED,
          errorMessage: expect.stringContaining('Maximum retry attempts reached'),
        })
      );
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });
  });
  
  describe('scheduleRetry', () => {
    it('should schedule a retry with exponential backoff', async () => {
      // Arrange
      const errorMessage = 'Connection timeout';
      
      // Act
      await retryService.scheduleRetry(mockPortalSubmissionId, mockUserId, errorMessage);
      
      // Assert
      expect(portalRepository.updatePortalSubmission).toHaveBeenCalledWith(
        mockPortalSubmissionId,
        expect.objectContaining({
          status: PortalSubmissionStatus.RETRY_SCHEDULED,
          retryCount: 1,
          nextRetryAt: expect.any(Date),
        })
      );
      
      // Fast-forward time to trigger the scheduled retry
      jest.advanceTimersByTime(60000); // 1 minute (base delay)
      
      // Wait for any pending promises to resolve
      await Promise.resolve();
      
      // Assert retry was executed
      expect(portalAutomationService.submitFormToPortal).toHaveBeenCalledWith(
        mockPortalSubmissionId,
        mockUserId
      );
    });
    
    it('should use exponential backoff for retry delays', async () => {
      // Arrange
      const submission1 = { ...mockPortalSubmission, retryCount: 0 };
      const submission2 = { ...mockPortalSubmission, retryCount: 1 };
      const submission3 = { ...mockPortalSubmission, retryCount: 2 };
      
      // Mock to return different submissions for different calls
      (portalRepository.getPortalSubmissionById as jest.Mock)
        .mockResolvedValueOnce(submission1)
        .mockResolvedValueOnce(submission2)
        .mockResolvedValueOnce(submission3);
      
      // Act & Assert for first retry (retryCount = 0)
      await retryService.scheduleRetry(mockPortalSubmissionId, mockUserId, 'Error 1');
      expect(portalRepository.updatePortalSubmission).toHaveBeenLastCalledWith(
        mockPortalSubmissionId,
        expect.objectContaining({ retryCount: 1 })
      );
      
      // Act & Assert for second retry (retryCount = 1)
      await retryService.scheduleRetry(mockPortalSubmissionId, mockUserId, 'Error 2');
      expect(portalRepository.updatePortalSubmission).toHaveBeenLastCalledWith(
        mockPortalSubmissionId,
        expect.objectContaining({ retryCount: 2 })
      );
      
      // Act & Assert for third retry (retryCount = 2)
      await retryService.scheduleRetry(mockPortalSubmissionId, mockUserId, 'Error 3');
      expect(portalRepository.updatePortalSubmission).toHaveBeenLastCalledWith(
        mockPortalSubmissionId,
        expect.objectContaining({ retryCount: 3 })
      );
      
      // Verify the delay increases exponentially
      const updateCalls = (portalRepository.updatePortalSubmission as jest.Mock).mock.calls;
      const delay1 = updateCalls[0][1].nextRetryAt.getTime() - Date.now();
      const delay2 = updateCalls[1][1].nextRetryAt.getTime() - Date.now();
      const delay3 = updateCalls[2][1].nextRetryAt.getTime() - Date.now();
      
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
      expect(delay2 / delay1).toBeCloseTo(2, 0); // Should be approximately double
      expect(delay3 / delay2).toBeCloseTo(2, 0); // Should be approximately double
    });
  });
});
