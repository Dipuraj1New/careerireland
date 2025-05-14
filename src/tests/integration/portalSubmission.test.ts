/**
 * Integration tests for portal submission functionality
 */
import { WebDriver } from 'selenium-webdriver';
import * as portalAutomationService from '../../services/portal/portalAutomationService';
import * as seleniumService from '../../services/portal/seleniumService';
import * as portalRepository from '../../repositories/portalRepository';
import * as formSubmissionRepository from '../../repositories/formSubmissionRepository';
import { 
  GovernmentPortalType, 
  PortalSubmission, 
  PortalSubmissionStatus 
} from '../../types/portal';
import { FormSubmission, FormSubmissionStatus } from '../../types/form';

// Mock dependencies
jest.mock('../../services/portal/seleniumService');
jest.mock('../../repositories/portalRepository');
jest.mock('../../repositories/formSubmissionRepository');
jest.mock('../../services/auditLogService');

describe('Portal Submission Integration Tests', () => {
  // Mock data
  const mockUserId = 'user-123';
  const mockFormSubmissionId = 'form-submission-123';
  const mockPortalSubmissionId = 'portal-submission-123';
  
  const mockPortalSubmission: PortalSubmission = {
    id: mockPortalSubmissionId,
    formSubmissionId: mockFormSubmissionId,
    portalType: GovernmentPortalType.IRISH_IMMIGRATION,
    status: PortalSubmissionStatus.PENDING,
    retryCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const mockFormSubmission: FormSubmission = {
    id: mockFormSubmissionId,
    templateId: 'template-123',
    caseId: 'case-123',
    formData: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      nationality: 'Canadian',
      passportNumber: 'AB123456',
      passportExpiry: '2030-01-01',
      visaType: 'STUDY',
      employerName: 'Tech Company Ltd',
      employerRegistrationNumber: '123456',
      employerAddress: '123 Business Park, Dublin',
      employerContactName: 'Jane Smith',
      employerPhone: '01234567890',
      employerEmail: 'contact@techcompany.ie',
      jobTitle: 'Software Engineer',
      jobDescription: 'Developing software applications',
      annualSalary: '60000',
      hoursPerWeek: '40',
      workLocation: 'Dublin',
      category: 'All',
      subcategory: 'Other',
    },
    status: FormSubmissionStatus.GENERATED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Mock WebDriver
  const mockDriver: Partial<WebDriver> = {
    get: jest.fn(),
    findElement: jest.fn(),
    wait: jest.fn(),
    takeScreenshot: jest.fn(),
    quit: jest.fn(),
    sleep: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock repository responses
    (portalRepository.getPortalSubmissionById as jest.Mock).mockResolvedValue(mockPortalSubmission);
    (formSubmissionRepository.getFormSubmissionById as jest.Mock).mockResolvedValue(mockFormSubmission);
    (portalRepository.updatePortalSubmission as jest.Mock).mockResolvedValue({
      ...mockPortalSubmission,
      status: PortalSubmissionStatus.IN_PROGRESS,
    });
    
    // Mock Selenium service
    (seleniumService.initializeWebDriver as jest.Mock).mockResolvedValue(mockDriver);
    (seleniumService.navigateTo as jest.Mock).mockResolvedValue(undefined);
    (seleniumService.findElementBySelector as jest.Mock).mockResolvedValue({});
    (seleniumService.findElementById as jest.Mock).mockResolvedValue({});
    (seleniumService.findElementByName as jest.Mock).mockResolvedValue({});
    (seleniumService.clickElement as jest.Mock).mockResolvedValue(undefined);
    (seleniumService.fillInput as jest.Mock).mockResolvedValue(undefined);
    (seleniumService.waitForUrlContains as jest.Mock).mockResolvedValue(true);
    (seleniumService.takeScreenshot as jest.Mock).mockResolvedValue('base64-screenshot');
    (seleniumService.closeDriver as jest.Mock).mockResolvedValue(undefined);
    (seleniumService.getPortalCredentials as jest.Mock).mockResolvedValue({
      username: 'test-user',
      password: 'test-password',
    });
    (portalRepository.getFieldMappingsByPortalType as jest.Mock).mockResolvedValue([
      {
        id: 'mapping-1',
        portalType: GovernmentPortalType.IRISH_IMMIGRATION,
        formField: 'firstName',
        portalField: 'first_name',
      },
      {
        id: 'mapping-2',
        portalType: GovernmentPortalType.IRISH_IMMIGRATION,
        formField: 'lastName',
        portalField: 'last_name',
      },
    ]);
  });
  
  describe('submitFormToPortal', () => {
    it('should submit form to Irish Immigration Portal successfully', async () => {
      // Arrange
      mockPortalSubmission.portalType = GovernmentPortalType.IRISH_IMMIGRATION;
      
      // Act
      const result = await portalAutomationService.submitFormToPortal(mockPortalSubmissionId, mockUserId);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.status).toBe(PortalSubmissionStatus.COMPLETED);
      expect(result.confirmationNumber).toBeDefined();
      expect(result.confirmationReceiptUrl).toBeDefined();
      expect(portalRepository.updatePortalSubmission).toHaveBeenCalledWith(
        mockPortalSubmissionId,
        expect.objectContaining({
          status: PortalSubmissionStatus.COMPLETED,
        })
      );
    });
    
    it('should submit form to Irish Visa Portal successfully', async () => {
      // Arrange
      mockPortalSubmission.portalType = GovernmentPortalType.IRISH_VISA;
      
      // Act
      const result = await portalAutomationService.submitFormToPortal(mockPortalSubmissionId, mockUserId);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.status).toBe(PortalSubmissionStatus.COMPLETED);
      expect(result.confirmationNumber).toBeDefined();
      expect(result.confirmationReceiptUrl).toBeDefined();
    });
    
    it('should submit form to GNIB Portal successfully', async () => {
      // Arrange
      mockPortalSubmission.portalType = GovernmentPortalType.GNIB;
      
      // Act
      const result = await portalAutomationService.submitFormToPortal(mockPortalSubmissionId, mockUserId);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.status).toBe(PortalSubmissionStatus.COMPLETED);
      expect(result.confirmationNumber).toBeDefined();
      expect(result.confirmationReceiptUrl).toBeDefined();
    });
    
    it('should submit form to Employment Permit Portal successfully', async () => {
      // Arrange
      mockPortalSubmission.portalType = GovernmentPortalType.EMPLOYMENT_PERMIT;
      
      // Act
      const result = await portalAutomationService.submitFormToPortal(mockPortalSubmissionId, mockUserId);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.status).toBe(PortalSubmissionStatus.COMPLETED);
      expect(result.confirmationNumber).toBeDefined();
      expect(result.confirmationReceiptUrl).toBeDefined();
    });
    
    it('should handle portal submission not found', async () => {
      // Arrange
      (portalRepository.getPortalSubmissionById as jest.Mock).mockResolvedValue(null);
      
      // Act
      const result = await portalAutomationService.submitFormToPortal(mockPortalSubmissionId, mockUserId);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(PortalSubmissionStatus.FAILED);
      expect(result.errorMessage).toBe('Portal submission not found');
    });
    
    it('should handle form submission not found', async () => {
      // Arrange
      (formSubmissionRepository.getFormSubmissionById as jest.Mock).mockResolvedValue(null);
      
      // Act
      const result = await portalAutomationService.submitFormToPortal(mockPortalSubmissionId, mockUserId);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(PortalSubmissionStatus.FAILED);
      expect(result.errorMessage).toBe('Form submission not found');
    });
    
    it('should handle errors during submission', async () => {
      // Arrange
      (seleniumService.navigateTo as jest.Mock).mockRejectedValue(new Error('Connection error'));
      
      // Act
      const result = await portalAutomationService.submitFormToPortal(mockPortalSubmissionId, mockUserId);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(PortalSubmissionStatus.FAILED);
      expect(result.errorMessage).toContain('Connection error');
      expect(portalRepository.updatePortalSubmission).toHaveBeenCalledWith(
        mockPortalSubmissionId,
        expect.objectContaining({
          status: PortalSubmissionStatus.FAILED,
        })
      );
    });
  });
});
