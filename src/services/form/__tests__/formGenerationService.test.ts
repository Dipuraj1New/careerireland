import { describe, it, expect, vi, beforeEach } from 'vitest';
import formGenerationService from '../formGenerationService';
import * as formTemplateService from '../formTemplateService';
import * as formSubmissionRepository from '../formSubmissionRepository';
import { createAuditLog } from '@/services/audit/auditService';
import { uploadFile } from '@/services/storage/storageService';
import { 
  FormTemplate, 
  FormTemplateStatus, 
  FormSubmission,
  FormSubmissionStatus,
  FormFieldType
} from '@/types/form';
import { DocumentType } from '@/types/document';

// Mock dependencies
vi.mock('../formTemplateService');
vi.mock('../formSubmissionRepository');
vi.mock('@/services/audit/auditService');
vi.mock('@/services/storage/storageService');
vi.mock('pdf-lib', () => {
  return {
    PDFDocument: {
      create: vi.fn().mockResolvedValue({
        addPage: vi.fn().mockReturnValue({
          drawText: vi.fn(),
          getSize: vi.fn().mockReturnValue({ width: 595, height: 842 }),
          drawImage: vi.fn(),
        }),
        embedFont: vi.fn().mockResolvedValue({}),
        embedPng: vi.fn().mockResolvedValue({}),
        embedJpg: vi.fn().mockResolvedValue({}),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      }),
    },
    StandardFonts: {
      Helvetica: 'Helvetica',
      HelveticaBold: 'Helvetica-Bold',
    },
    rgb: vi.fn().mockReturnValue({}),
  };
});

describe('Form Generation Service', () => {
  const mockUserId = 'user-123';
  const mockTemplateId = 'template-123';
  const mockCaseId = 'case-123';
  const mockSubmissionId = 'submission-123';
  
  const mockTemplate: FormTemplate = {
    id: mockTemplateId,
    name: 'Test Template',
    description: 'Test Description',
    version: 1,
    status: FormTemplateStatus.ACTIVE,
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
    createdBy: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
  };
  
  const mockFormData = {
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'Smith',
  };
  
  const mockSubmission: FormSubmission = {
    id: mockSubmissionId,
    templateId: mockTemplateId,
    templateVersion: 1,
    caseId: mockCaseId,
    userId: mockUserId,
    formData: mockFormData,
    filePath: 'forms/case-123/test-template.pdf',
    fileName: 'test-template.pdf',
    fileSize: 1024,
    status: FormSubmissionStatus.GENERATED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  describe('generateForm', () => {
    it('should generate a form successfully', async () => {
      // Mock dependencies
      vi.mocked(formTemplateService.getFormTemplateById).mockResolvedValue(mockTemplate);
      vi.mocked(uploadFile).mockResolvedValue({
        success: true,
        url: 'forms/case-123/test-template.pdf',
      });
      vi.mocked(formSubmissionRepository.createFormSubmission).mockResolvedValue(mockSubmission);
      
      // Call service
      const result = await formGenerationService.generateForm(
        mockTemplateId,
        mockFormData,
        mockCaseId,
        mockUserId
      );
      
      // Verify dependencies were called
      expect(formTemplateService.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
      expect(uploadFile).toHaveBeenCalled();
      expect(formSubmissionRepository.createFormSubmission).toHaveBeenCalled();
      expect(createAuditLog).toHaveBeenCalled();
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.submission).toEqual(mockSubmission);
    });
    
    it('should return error if template not found', async () => {
      // Mock dependencies
      vi.mocked(formTemplateService.getFormTemplateById).mockResolvedValue(null);
      
      // Call service
      const result = await formGenerationService.generateForm(
        mockTemplateId,
        mockFormData,
        mockCaseId,
        mockUserId
      );
      
      // Verify dependencies were called
      expect(formTemplateService.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
      
      // Verify result
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
    
    it('should return error if template is not active', async () => {
      // Mock dependencies
      vi.mocked(formTemplateService.getFormTemplateById).mockResolvedValue({
        ...mockTemplate,
        status: FormTemplateStatus.DRAFT,
      });
      
      // Call service
      const result = await formGenerationService.generateForm(
        mockTemplateId,
        mockFormData,
        mockCaseId,
        mockUserId
      );
      
      // Verify dependencies were called
      expect(formTemplateService.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
      
      // Verify result
      expect(result.success).toBe(false);
      expect(result.message).toContain('not active');
    });
    
    it('should return error if required fields are missing', async () => {
      // Mock dependencies
      vi.mocked(formTemplateService.getFormTemplateById).mockResolvedValue(mockTemplate);
      
      // Call service with missing required field
      const incompleteFormData = {
        firstName: 'John',
        // lastName is missing
      };
      
      const result = await formGenerationService.generateForm(
        mockTemplateId,
        incompleteFormData,
        mockCaseId,
        mockUserId
      );
      
      // Verify dependencies were called
      expect(formTemplateService.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
      
      // Verify result
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required fields');
      expect(result.missingFields).toContain('lastName');
    });
    
    it('should return error if upload fails', async () => {
      // Mock dependencies
      vi.mocked(formTemplateService.getFormTemplateById).mockResolvedValue(mockTemplate);
      vi.mocked(uploadFile).mockResolvedValue({
        success: false,
        error: 'Upload failed',
      });
      
      // Call service
      const result = await formGenerationService.generateForm(
        mockTemplateId,
        mockFormData,
        mockCaseId,
        mockUserId
      );
      
      // Verify dependencies were called
      expect(formTemplateService.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
      expect(uploadFile).toHaveBeenCalled();
      
      // Verify result
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to upload');
    });
  });
  
  describe('submitForm', () => {
    it('should submit a form successfully', async () => {
      // Mock dependencies
      vi.mocked(formSubmissionRepository.getFormSubmissionById).mockResolvedValue(mockSubmission);
      vi.mocked(formSubmissionRepository.updateFormSubmissionStatus).mockResolvedValue({
        ...mockSubmission,
        status: FormSubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
      });
      
      // Call service
      const result = await formGenerationService.submitForm(
        mockSubmissionId,
        mockUserId
      );
      
      // Verify dependencies were called
      expect(formSubmissionRepository.getFormSubmissionById).toHaveBeenCalledWith(mockSubmissionId);
      expect(formSubmissionRepository.updateFormSubmissionStatus).toHaveBeenCalledWith(
        mockSubmissionId,
        FormSubmissionStatus.SUBMITTED
      );
      expect(createAuditLog).toHaveBeenCalled();
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.submission?.status).toBe(FormSubmissionStatus.SUBMITTED);
    });
    
    it('should return error if submission not found', async () => {
      // Mock dependencies
      vi.mocked(formSubmissionRepository.getFormSubmissionById).mockResolvedValue(null);
      
      // Call service
      const result = await formGenerationService.submitForm(
        mockSubmissionId,
        mockUserId
      );
      
      // Verify dependencies were called
      expect(formSubmissionRepository.getFormSubmissionById).toHaveBeenCalledWith(mockSubmissionId);
      
      // Verify result
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
    
    it('should return error if submission is already submitted', async () => {
      // Mock dependencies
      vi.mocked(formSubmissionRepository.getFormSubmissionById).mockResolvedValue({
        ...mockSubmission,
        status: FormSubmissionStatus.SUBMITTED,
      });
      
      // Call service
      const result = await formGenerationService.submitForm(
        mockSubmissionId,
        mockUserId
      );
      
      // Verify dependencies were called
      expect(formSubmissionRepository.getFormSubmissionById).toHaveBeenCalledWith(mockSubmissionId);
      
      // Verify result
      expect(result.success).toBe(false);
      expect(result.message).toContain('already submitted');
    });
  });
});
