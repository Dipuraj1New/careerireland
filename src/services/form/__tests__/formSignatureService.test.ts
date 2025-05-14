import { 
  signForm, 
  verifySignature 
} from '../formSignatureService';
import * as formSubmissionRepository from '../formSubmissionRepository';
import * as auditService from '@/services/audit/auditService';
import * as storageService from '@/services/storage/storageService';
import { 
  FormSubmission, 
  FormSubmissionStatus, 
  FormSignature, 
  SignatureType 
} from '@/types/form';

// Mock dependencies
jest.mock('../formSubmissionRepository');
jest.mock('@/services/audit/auditService');
jest.mock('@/services/storage/storageService');

describe('Form Signature Service', () => {
  // Mock data
  const mockUserId = 'user-123';
  const mockSubmissionId = 'submission-123';
  const mockSignatureId = 'signature-123';
  const mockSignatureData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const mockIpAddress = '127.0.0.1';
  const mockUserAgent = 'Jest Test Agent';
  
  const mockSubmission: FormSubmission = {
    id: mockSubmissionId,
    templateId: 'template-123',
    templateVersion: 1,
    caseId: 'case-123',
    userId: mockUserId,
    formData: {},
    filePath: 'forms/submission-123.pdf',
    fileName: 'test-form.pdf',
    fileSize: 1024,
    status: FormSubmissionStatus.GENERATED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const mockSignature: FormSignature = {
    id: mockSignatureId,
    submissionId: mockSubmissionId,
    userId: mockUserId,
    signatureData: mockSignatureData,
    signatureType: SignatureType.DRAWN,
    ipAddress: mockIpAddress,
    userAgent: mockUserAgent,
    createdAt: new Date(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (formSubmissionRepository.getFormSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);
    (formSubmissionRepository.createFormSignature as jest.Mock).mockResolvedValue(mockSignature);
    (formSubmissionRepository.getFormSignatureById as jest.Mock).mockResolvedValue(mockSignature);
    (auditService.createAuditLog as jest.Mock).mockResolvedValue(undefined);
    (storageService.getFileFromStorage as jest.Mock).mockResolvedValue({
      success: true,
      data: Buffer.from('mock pdf content'),
    });
    (storageService.uploadFile as jest.Mock).mockResolvedValue({
      success: true,
      filePath: 'forms/submission-123.pdf',
    });
  });
  
  describe('signForm', () => {
    it('should successfully sign a form', async () => {
      const result = await signForm(
        mockSubmissionId,
        mockSignatureData,
        SignatureType.DRAWN,
        mockUserId,
        mockIpAddress,
        mockUserAgent
      );
      
      expect(result.success).toBe(true);
      expect(result.signature).toEqual(mockSignature);
      
      // Verify repository calls
      expect(formSubmissionRepository.getFormSubmissionById).toHaveBeenCalledWith(mockSubmissionId);
      expect(formSubmissionRepository.createFormSignature).toHaveBeenCalledWith(
        expect.objectContaining({
          submissionId: mockSubmissionId,
          signatureData: mockSignatureData,
          signatureType: SignatureType.DRAWN,
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
        }),
        mockUserId
      );
      
      // Verify audit log creation
      expect(auditService.createAuditLog).toHaveBeenCalled();
      
      // Verify PDF modification
      expect(storageService.getFileFromStorage).toHaveBeenCalledWith(mockSubmission.filePath);
      expect(storageService.uploadFile).toHaveBeenCalled();
    });
    
    it('should fail if submission does not exist', async () => {
      (formSubmissionRepository.getFormSubmissionById as jest.Mock).mockResolvedValue(null);
      
      const result = await signForm(
        mockSubmissionId,
        mockSignatureData,
        SignatureType.DRAWN,
        mockUserId
      );
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
    
    it('should fail if submission is not in GENERATED status', async () => {
      const submittedSubmission = {
        ...mockSubmission,
        status: FormSubmissionStatus.SUBMITTED,
      };
      
      (formSubmissionRepository.getFormSubmissionById as jest.Mock).mockResolvedValue(submittedSubmission);
      
      const result = await signForm(
        mockSubmissionId,
        mockSignatureData,
        SignatureType.DRAWN,
        mockUserId
      );
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot sign a form');
    });
  });
  
  describe('verifySignature', () => {
    it('should successfully verify a valid signature', async () => {
      const result = await verifySignature(
        mockSubmissionId,
        mockSignatureId,
        mockUserId
      );
      
      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
      
      // Verify repository calls
      expect(formSubmissionRepository.getFormSubmissionById).toHaveBeenCalledWith(mockSubmissionId);
      expect(formSubmissionRepository.getFormSignatureById).toHaveBeenCalledWith(mockSignatureId);
      
      // Verify audit log creation
      expect(auditService.createAuditLog).toHaveBeenCalled();
    });
    
    it('should fail if submission does not exist', async () => {
      (formSubmissionRepository.getFormSubmissionById as jest.Mock).mockResolvedValue(null);
      
      const result = await verifySignature(
        mockSubmissionId,
        mockSignatureId,
        mockUserId
      );
      
      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.message).toContain('not found');
    });
    
    it('should fail if signature does not exist', async () => {
      (formSubmissionRepository.getFormSignatureById as jest.Mock).mockResolvedValue(null);
      
      const result = await verifySignature(
        mockSubmissionId,
        mockSignatureId,
        mockUserId
      );
      
      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.message).toContain('not found');
    });
    
    it('should fail if signature does not belong to submission', async () => {
      const wrongSignature = {
        ...mockSignature,
        submissionId: 'wrong-submission-id',
      };
      
      (formSubmissionRepository.getFormSignatureById as jest.Mock).mockResolvedValue(wrongSignature);
      
      const result = await verifySignature(
        mockSubmissionId,
        mockSignatureId,
        mockUserId
      );
      
      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.message).toContain('does not belong');
    });
  });
});
