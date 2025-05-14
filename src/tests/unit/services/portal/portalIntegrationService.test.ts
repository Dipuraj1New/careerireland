/**
 * Tests for portal integration service
 */
import * as portalIntegrationService from '../../../../services/portal/portalIntegrationService';
import * as portalRepository from '../../../../repositories/portalRepository';
import * as formSubmissionRepository from '../../../../repositories/formSubmissionRepository';
import * as formTemplateRepository from '../../../../repositories/formTemplateRepository';
import * as portalAutomationService from '../../../../services/portal/portalAutomationService';
import * as auditLogService from '../../../../services/auditLogService';
import {
  GovernmentPortalType,
  PortalFieldMapping,
  PortalSubmission,
  PortalSubmissionStatus,
} from '../../../../types/portal';
import { FormSubmissionStatus } from '../../../../types/form';

// Mock dependencies
jest.mock('../../../../repositories/portalRepository');
jest.mock('../../../../repositories/formSubmissionRepository');
jest.mock('../../../../repositories/formTemplateRepository');
jest.mock('../../../../services/portal/portalAutomationService');
jest.mock('../../../../services/auditLogService');

describe('Portal Integration Service', () => {
  // Mock data
  const mockUserId = 'user-123';
  const mockFormSubmissionId = 'form-submission-123';
  const mockPortalSubmissionId = 'portal-submission-123';
  const mockCaseId = 'case-123';
  
  const mockFieldMapping: PortalFieldMapping = {
    id: 'mapping-123',
    portalType: GovernmentPortalType.IRISH_IMMIGRATION,
    formField: 'firstName',
    portalField: 'first_name',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const mockPortalSubmission: PortalSubmission = {
    id: mockPortalSubmissionId,
    formSubmissionId: mockFormSubmissionId,
    portalType: GovernmentPortalType.IRISH_IMMIGRATION,
    status: PortalSubmissionStatus.PENDING,
    retryCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const mockFormSubmission = {
    id: mockFormSubmissionId,
    templateId: 'template-123',
    caseId: mockCaseId,
    formData: {
      firstName: 'John',
      lastName: 'Doe',
    },
    status: FormSubmissionStatus.GENERATED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const mockTemplate = {
    id: 'template-123',
    name: 'Irish Immigration Form',
    version: '1.0',
    requiredFields: ['firstName', 'lastName'],
    optionalFields: ['middleName'],
    fieldMappings: {
      firstName: 'First Name',
      lastName: 'Last Name',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getFieldMappings', () => {
    it('should return field mappings for a portal type', async () => {
      // Mock repository response
      (portalRepository.getFieldMappingsByPortalType as jest.Mock).mockResolvedValue([mockFieldMapping]);
      
      // Call service
      const result = await portalIntegrationService.getFieldMappings(GovernmentPortalType.IRISH_IMMIGRATION);
      
      // Assertions
      expect(portalRepository.getFieldMappingsByPortalType).toHaveBeenCalledWith(GovernmentPortalType.IRISH_IMMIGRATION);
      expect(result).toEqual([mockFieldMapping]);
    });
  });
  
  describe('createFieldMapping', () => {
    it('should create a field mapping', async () => {
      // Mock repository response
      (portalRepository.createFieldMapping as jest.Mock).mockResolvedValue(mockFieldMapping);
      (auditLogService.createAuditLog as jest.Mock).mockResolvedValue({});
      
      // Call service
      const result = await portalIntegrationService.createFieldMapping(
        {
          portalType: GovernmentPortalType.IRISH_IMMIGRATION,
          formField: 'firstName',
          portalField: 'first_name',
        },
        mockUserId
      );
      
      // Assertions
      expect(portalRepository.createFieldMapping).toHaveBeenCalledWith({
        portalType: GovernmentPortalType.IRISH_IMMIGRATION,
        formField: 'firstName',
        portalField: 'first_name',
      });
      expect(auditLogService.createAuditLog).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        mapping: mockFieldMapping,
      });
    });
    
    it('should handle errors', async () => {
      // Mock repository error
      (portalRepository.createFieldMapping as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Call service
      const result = await portalIntegrationService.createFieldMapping(
        {
          portalType: GovernmentPortalType.IRISH_IMMIGRATION,
          formField: 'firstName',
          portalField: 'first_name',
        },
        mockUserId
      );
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to create field mapping: Database error',
      });
    });
  });
  
  describe('submitFormToPortal', () => {
    beforeEach(() => {
      // Mock repository responses
      (formSubmissionRepository.getFormSubmissionById as jest.Mock).mockResolvedValue(mockFormSubmission);
      (formTemplateRepository.getFormTemplateById as jest.Mock).mockResolvedValue(mockTemplate);
      (portalRepository.getPortalSubmissionByFormSubmissionId as jest.Mock).mockResolvedValue(null);
      (portalRepository.createPortalSubmission as jest.Mock).mockResolvedValue(mockPortalSubmission);
      (formSubmissionRepository.updateFormSubmissionStatus as jest.Mock).mockResolvedValue({
        ...mockFormSubmission,
        status: FormSubmissionStatus.SUBMITTED,
      });
      (auditLogService.createAuditLog as jest.Mock).mockResolvedValue({});
      
      // Mock setTimeout
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should submit a form to the portal', async () => {
      // Call service
      const result = await portalIntegrationService.submitFormToPortal(mockFormSubmissionId, mockUserId);
      
      // Assertions
      expect(formSubmissionRepository.getFormSubmissionById).toHaveBeenCalledWith(mockFormSubmissionId);
      expect(formTemplateRepository.getFormTemplateById).toHaveBeenCalledWith(mockFormSubmission.templateId);
      expect(portalRepository.getPortalSubmissionByFormSubmissionId).toHaveBeenCalledWith(mockFormSubmissionId);
      expect(portalRepository.createPortalSubmission).toHaveBeenCalledWith({
        formSubmissionId: mockFormSubmissionId,
        portalType: GovernmentPortalType.IRISH_IMMIGRATION,
      });
      expect(formSubmissionRepository.updateFormSubmissionStatus).toHaveBeenCalledWith(
        mockFormSubmissionId,
        FormSubmissionStatus.SUBMITTED
      );
      expect(auditLogService.createAuditLog).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        submission: mockPortalSubmission,
      });
      
      // Verify that the automation service is called asynchronously
      jest.runAllTimers();
      expect(setTimeout).toHaveBeenCalled();
    });
    
    it('should use existing portal submission if available', async () => {
      // Mock existing portal submission
      (portalRepository.getPortalSubmissionByFormSubmissionId as jest.Mock).mockResolvedValue(mockPortalSubmission);
      
      // Call service
      const result = await portalIntegrationService.submitFormToPortal(mockFormSubmissionId, mockUserId);
      
      // Assertions
      expect(portalRepository.createPortalSubmission).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        submission: mockPortalSubmission,
      });
    });
    
    it('should handle form submission not found', async () => {
      // Mock form submission not found
      (formSubmissionRepository.getFormSubmissionById as jest.Mock).mockResolvedValue(null);
      
      // Call service
      const result = await portalIntegrationService.submitFormToPortal(mockFormSubmissionId, mockUserId);
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Form submission not found',
      });
    });
    
    it('should handle form template not found', async () => {
      // Mock form template not found
      (formTemplateRepository.getFormTemplateById as jest.Mock).mockResolvedValue(null);
      
      // Call service
      const result = await portalIntegrationService.submitFormToPortal(mockFormSubmissionId, mockUserId);
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Form template not found',
      });
    });
  });
  
  describe('getPortalSubmissionStatus', () => {
    it('should return portal submission status', async () => {
      // Mock repository response
      (portalRepository.getPortalSubmissionByFormSubmissionId as jest.Mock).mockResolvedValue(mockPortalSubmission);
      
      // Call service
      const result = await portalIntegrationService.getPortalSubmissionStatus(mockFormSubmissionId);
      
      // Assertions
      expect(portalRepository.getPortalSubmissionByFormSubmissionId).toHaveBeenCalledWith(mockFormSubmissionId);
      expect(result).toEqual({
        success: true,
        submission: mockPortalSubmission,
      });
    });
    
    it('should handle portal submission not found', async () => {
      // Mock repository response
      (portalRepository.getPortalSubmissionByFormSubmissionId as jest.Mock).mockResolvedValue(null);
      
      // Call service
      const result = await portalIntegrationService.getPortalSubmissionStatus(mockFormSubmissionId);
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Portal submission not found',
      });
    });
  });
  
  describe('retryPortalSubmission', () => {
    beforeEach(() => {
      // Mock repository responses
      (portalRepository.getPortalSubmissionById as jest.Mock).mockResolvedValue({
        ...mockPortalSubmission,
        status: PortalSubmissionStatus.FAILED,
      });
      (portalRepository.updatePortalSubmission as jest.Mock).mockResolvedValue({
        ...mockPortalSubmission,
        status: PortalSubmissionStatus.RETRYING,
      });
      (auditLogService.createAuditLog as jest.Mock).mockResolvedValue({});
      
      // Mock setTimeout
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should retry a failed portal submission', async () => {
      // Call service
      const result = await portalIntegrationService.retryPortalSubmission(mockPortalSubmissionId, mockUserId);
      
      // Assertions
      expect(portalRepository.getPortalSubmissionById).toHaveBeenCalledWith(mockPortalSubmissionId);
      expect(portalRepository.updatePortalSubmission).toHaveBeenCalledWith(
        mockPortalSubmissionId,
        {
          status: PortalSubmissionStatus.RETRYING,
        }
      );
      expect(auditLogService.createAuditLog).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        submission: {
          ...mockPortalSubmission,
          status: PortalSubmissionStatus.RETRYING,
        },
      });
      
      // Verify that the automation service is called asynchronously
      jest.runAllTimers();
      expect(setTimeout).toHaveBeenCalled();
    });
    
    it('should handle portal submission not found', async () => {
      // Mock portal submission not found
      (portalRepository.getPortalSubmissionById as jest.Mock).mockResolvedValue(null);
      
      // Call service
      const result = await portalIntegrationService.retryPortalSubmission(mockPortalSubmissionId, mockUserId);
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Portal submission not found',
      });
    });
    
    it('should handle invalid submission status', async () => {
      // Mock submission with invalid status
      (portalRepository.getPortalSubmissionById as jest.Mock).mockResolvedValue({
        ...mockPortalSubmission,
        status: PortalSubmissionStatus.COMPLETED,
      });
      
      // Call service
      const result = await portalIntegrationService.retryPortalSubmission(mockPortalSubmissionId, mockUserId);
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: `Cannot retry submission with status ${PortalSubmissionStatus.COMPLETED}`,
      });
    });
  });
});
