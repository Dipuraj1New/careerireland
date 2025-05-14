import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as formTemplateService from '../formTemplateService';
import * as formTemplateRepository from '../formTemplateRepository';
import { createAuditLog } from '@/services/audit/auditService';
import { 
  FormTemplate, 
  FormTemplateStatus, 
  FormTemplateVersion,
  FormTemplateCreateData,
  FormTemplateUpdateData,
  FormFieldType
} from '@/types/form';
import { DocumentType } from '@/types/document';

// Mock dependencies
vi.mock('../formTemplateRepository');
vi.mock('@/services/audit/auditService');

describe('Form Template Service', () => {
  const mockUserId = 'user-123';
  const mockTemplateId = 'template-123';
  
  const mockTemplateData: FormTemplateCreateData = {
    name: 'Test Template',
    description: 'Test Description',
    documentTypes: [DocumentType.PASSPORT],
    requiredFields: ['firstName', 'lastName'],
    optionalFields: ['middleName'],
    fieldMappings: {
      firstName: 'First Name',
      lastName: 'Last Name',
      middleName: 'Middle Name',
    },
    templateData: {
      title: 'Test Form',
      sections: [
        {
          title: 'Personal Information',
          fields: [
            {
              id: 'firstName',
              type: FormFieldType.TEXT,
              label: 'First Name',
              required: true,
            },
            {
              id: 'lastName',
              type: FormFieldType.TEXT,
              label: 'Last Name',
              required: true,
            },
            {
              id: 'middleName',
              type: FormFieldType.TEXT,
              label: 'Middle Name',
              required: false,
            },
          ],
        },
      ],
    },
  };
  
  const mockTemplate: FormTemplate = {
    id: mockTemplateId,
    name: mockTemplateData.name,
    description: mockTemplateData.description,
    version: 1,
    status: FormTemplateStatus.DRAFT,
    documentTypes: mockTemplateData.documentTypes,
    requiredFields: mockTemplateData.requiredFields,
    optionalFields: mockTemplateData.optionalFields,
    fieldMappings: mockTemplateData.fieldMappings,
    templateData: mockTemplateData.templateData,
    createdBy: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  describe('createFormTemplate', () => {
    it('should create a form template', async () => {
      // Mock repository response
      vi.mocked(formTemplateRepository.createFormTemplate).mockResolvedValue(mockTemplate);
      
      // Call service
      const result = await formTemplateService.createFormTemplate(mockTemplateData, mockUserId);
      
      // Verify repository was called
      expect(formTemplateRepository.createFormTemplate).toHaveBeenCalledWith(
        mockTemplateData,
        mockUserId
      );
      
      // Verify audit log was created
      expect(createAuditLog).toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual(mockTemplate);
    });
    
    it('should throw an error if template data is invalid', async () => {
      // Create invalid template data
      const invalidTemplateData = { ...mockTemplateData };
      invalidTemplateData.name = '';
      
      // Call service and expect error
      await expect(
        formTemplateService.createFormTemplate(invalidTemplateData, mockUserId)
      ).rejects.toThrow('Template name is required');
      
      // Verify repository was not called
      expect(formTemplateRepository.createFormTemplate).not.toHaveBeenCalled();
    });
  });
  
  describe('getFormTemplateById', () => {
    it('should get a form template by ID', async () => {
      // Mock repository response
      vi.mocked(formTemplateRepository.getFormTemplateById).mockResolvedValue(mockTemplate);
      
      // Call service
      const result = await formTemplateService.getFormTemplateById(mockTemplateId);
      
      // Verify repository was called
      expect(formTemplateRepository.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
      
      // Verify result
      expect(result).toEqual(mockTemplate);
    });
    
    it('should return null if template not found', async () => {
      // Mock repository response
      vi.mocked(formTemplateRepository.getFormTemplateById).mockResolvedValue(null);
      
      // Call service
      const result = await formTemplateService.getFormTemplateById(mockTemplateId);
      
      // Verify repository was called
      expect(formTemplateRepository.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
      
      // Verify result
      expect(result).toBeNull();
    });
  });
  
  describe('getFormTemplates', () => {
    it('should get form templates with options', async () => {
      // Mock repository response
      vi.mocked(formTemplateRepository.getFormTemplates).mockResolvedValue([mockTemplate]);
      
      // Call service
      const options = {
        status: FormTemplateStatus.DRAFT,
        documentType: DocumentType.PASSPORT,
        limit: 10,
        offset: 0,
      };
      const result = await formTemplateService.getFormTemplates(options);
      
      // Verify repository was called
      expect(formTemplateRepository.getFormTemplates).toHaveBeenCalledWith(options);
      
      // Verify result
      expect(result).toEqual([mockTemplate]);
    });
  });
  
  describe('updateFormTemplate', () => {
    it('should update a form template', async () => {
      // Mock repository responses
      vi.mocked(formTemplateRepository.getFormTemplateById).mockResolvedValue(mockTemplate);
      vi.mocked(formTemplateRepository.updateFormTemplate).mockResolvedValue({
        ...mockTemplate,
        name: 'Updated Template',
      });
      
      // Call service
      const updateData: FormTemplateUpdateData = {
        name: 'Updated Template',
      };
      const result = await formTemplateService.updateFormTemplate(
        mockTemplateId,
        updateData,
        mockUserId
      );
      
      // Verify repository was called
      expect(formTemplateRepository.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
      expect(formTemplateRepository.updateFormTemplate).toHaveBeenCalledWith(
        mockTemplateId,
        updateData,
        mockUserId
      );
      
      // Verify audit log was created
      expect(createAuditLog).toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual({
        ...mockTemplate,
        name: 'Updated Template',
      });
    });
    
    it('should throw an error if template not found', async () => {
      // Mock repository response
      vi.mocked(formTemplateRepository.getFormTemplateById).mockResolvedValue(null);
      
      // Call service and expect error
      await expect(
        formTemplateService.updateFormTemplate(
          mockTemplateId,
          { name: 'Updated Template' },
          mockUserId
        )
      ).rejects.toThrow(`Template with ID ${mockTemplateId} not found`);
      
      // Verify repository was called
      expect(formTemplateRepository.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
      expect(formTemplateRepository.updateFormTemplate).not.toHaveBeenCalled();
    });
    
    it('should throw an error if trying to update active template without creating new version', async () => {
      // Mock repository response
      vi.mocked(formTemplateRepository.getFormTemplateById).mockResolvedValue({
        ...mockTemplate,
        status: FormTemplateStatus.ACTIVE,
      });
      
      // Call service and expect error
      await expect(
        formTemplateService.updateFormTemplate(
          mockTemplateId,
          { name: 'Updated Template' },
          mockUserId
        )
      ).rejects.toThrow('Cannot update an active template without creating a new version');
      
      // Verify repository was called
      expect(formTemplateRepository.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
      expect(formTemplateRepository.updateFormTemplate).not.toHaveBeenCalled();
    });
    
    it('should create a new version if createNewVersion is true', async () => {
      // Mock repository responses
      vi.mocked(formTemplateRepository.getFormTemplateById).mockResolvedValue(mockTemplate);
      vi.mocked(formTemplateRepository.createFormTemplateVersion).mockResolvedValue({
        ...mockTemplate,
        version: 2,
        name: 'Updated Template',
      });
      
      // Call service
      const updateData: FormTemplateUpdateData = {
        name: 'Updated Template',
      };
      const result = await formTemplateService.updateFormTemplate(
        mockTemplateId,
        updateData,
        mockUserId,
        true // Create new version
      );
      
      // Verify repository was called
      expect(formTemplateRepository.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
      expect(formTemplateRepository.createFormTemplateVersion).toHaveBeenCalledWith(
        mockTemplateId,
        updateData,
        mockUserId
      );
      
      // Verify audit log was created
      expect(createAuditLog).toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual({
        ...mockTemplate,
        version: 2,
        name: 'Updated Template',
      });
    });
  });
  
  describe('activateFormTemplate', () => {
    it('should activate a form template', async () => {
      // Mock repository responses
      vi.mocked(formTemplateRepository.getFormTemplateById).mockResolvedValue(mockTemplate);
      vi.mocked(formTemplateRepository.updateFormTemplate).mockResolvedValue({
        ...mockTemplate,
        status: FormTemplateStatus.ACTIVE,
      });
      
      // Call service
      const result = await formTemplateService.activateFormTemplate(
        mockTemplateId,
        mockUserId
      );
      
      // Verify repository was called
      expect(formTemplateRepository.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
      expect(formTemplateRepository.updateFormTemplate).toHaveBeenCalledWith(
        mockTemplateId,
        { status: FormTemplateStatus.ACTIVE },
        mockUserId
      );
      
      // Verify audit log was created
      expect(createAuditLog).toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual({
        ...mockTemplate,
        status: FormTemplateStatus.ACTIVE,
      });
    });
  });
});
