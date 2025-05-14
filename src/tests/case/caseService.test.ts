import { v4 as uuidv4 } from 'uuid';
import { 
  createNewCase, 
  getCaseWithDocuments, 
  updateCaseStatus, 
  assignCaseToAgent, 
  updateCasePriority 
} from '@/services/case/caseService';
import { 
  createCase, 
  getCaseById, 
  updateCase 
} from '@/services/case/caseRepository';
import { getDocumentsByCase } from '@/services/document/documentService';
import { createAuditLog } from '@/services/audit/auditService';
import { CaseStatus, CasePriority, VisaType } from '@/types/case';
import { AuditAction, AuditEntityType } from '@/types/audit';

// Mock the repository and other services
jest.mock('@/services/case/caseRepository');
jest.mock('@/services/document/documentService');
jest.mock('@/services/audit/auditService');

describe('Case Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createNewCase', () => {
    it('should create a new case and audit log', async () => {
      // Mock data
      const userId = uuidv4();
      const caseData = {
        applicantId: userId,
        visaType: VisaType.STUDENT,
        priority: CasePriority.STANDARD,
        notes: 'Test notes',
      };
      
      const mockCase = {
        id: uuidv4(),
        ...caseData,
        status: CaseStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Set up mock implementations
      (createCase as jest.Mock).mockResolvedValue(mockCase);
      (createAuditLog as jest.Mock).mockResolvedValue({});
      
      // Call the function
      const result = await createNewCase(caseData, userId);
      
      // Check that the repository was called with the correct parameters
      expect(createCase).toHaveBeenCalledWith(caseData);
      
      // Check that the audit log was created
      expect(createAuditLog).toHaveBeenCalledWith({
        userId,
        entityType: AuditEntityType.CASE,
        entityId: mockCase.id,
        action: AuditAction.CREATE,
        details: expect.objectContaining({
          visaType: mockCase.visaType,
          priority: mockCase.priority,
        }),
      });
      
      // Check the result
      expect(result).toEqual(mockCase);
    });
  });
  
  describe('getCaseWithDocuments', () => {
    it('should return case with documents', async () => {
      // Mock data
      const caseId = uuidv4();
      const mockCase = {
        id: caseId,
        applicantId: uuidv4(),
        visaType: VisaType.STUDENT,
        status: CaseStatus.DRAFT,
        priority: CasePriority.STANDARD,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const mockDocuments = [
        {
          id: uuidv4(),
          caseId,
          type: 'passport',
          status: 'pending',
          filePath: 'path/to/file.pdf',
          fileName: 'passport.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedBy: mockCase.applicantId,
          createdAt: new Date(),
          updatedAt: new Date(),
          validationResults: [],
        },
      ];
      
      // Set up mock implementations
      (getCaseById as jest.Mock).mockResolvedValue(mockCase);
      (getDocumentsByCase as jest.Mock).mockResolvedValue(mockDocuments);
      
      // Call the function
      const result = await getCaseWithDocuments(caseId);
      
      // Check that the repository was called with the correct parameters
      expect(getCaseById).toHaveBeenCalledWith(caseId);
      expect(getDocumentsByCase).toHaveBeenCalledWith(caseId);
      
      // Check the result
      expect(result).toEqual({
        ...mockCase,
        documents: mockDocuments,
      });
    });
    
    it('should return null when case not found', async () => {
      // Set up mock implementations
      (getCaseById as jest.Mock).mockResolvedValue(null);
      
      // Call the function
      const result = await getCaseWithDocuments(uuidv4());
      
      // Check the result
      expect(result).toBeNull();
      expect(getDocumentsByCase).not.toHaveBeenCalled();
    });
  });
  
  describe('updateCaseStatus', () => {
    it('should update case status and create audit log', async () => {
      // Mock data
      const caseId = uuidv4();
      const userId = uuidv4();
      const currentStatus = CaseStatus.DRAFT;
      const newStatus = CaseStatus.SUBMITTED;
      const notes = 'Status update notes';
      
      const mockCase = {
        id: caseId,
        applicantId: uuidv4(),
        visaType: VisaType.STUDENT,
        status: currentStatus,
        priority: CasePriority.STANDARD,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedMockCase = {
        ...mockCase,
        status: newStatus,
        submissionDate: new Date(),
      };
      
      // Set up mock implementations
      (getCaseById as jest.Mock).mockResolvedValue(mockCase);
      (updateCase as jest.Mock).mockResolvedValue(updatedMockCase);
      (createAuditLog as jest.Mock).mockResolvedValue({});
      
      // Call the function
      const result = await updateCaseStatus(caseId, newStatus, userId, notes);
      
      // Check that the repository was called with the correct parameters
      expect(getCaseById).toHaveBeenCalledWith(caseId);
      expect(updateCase).toHaveBeenCalledWith(caseId, {
        status: newStatus,
        notes,
      });
      
      // Check that the audit log was created
      expect(createAuditLog).toHaveBeenCalledWith({
        userId,
        entityType: AuditEntityType.CASE,
        entityId: caseId,
        action: AuditAction.UPDATE_STATUS,
        details: expect.objectContaining({
          previousStatus: currentStatus,
          newStatus,
          notes,
        }),
      });
      
      // Check the result
      expect(result).toEqual(updatedMockCase);
    });
    
    it('should throw error for invalid status transition', async () => {
      // Mock data
      const caseId = uuidv4();
      const userId = uuidv4();
      const currentStatus = CaseStatus.REJECTED;
      const newStatus = CaseStatus.APPROVED;
      
      const mockCase = {
        id: caseId,
        applicantId: uuidv4(),
        visaType: VisaType.STUDENT,
        status: currentStatus,
        priority: CasePriority.STANDARD,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Set up mock implementations
      (getCaseById as jest.Mock).mockResolvedValue(mockCase);
      
      // Call the function and expect it to throw
      await expect(updateCaseStatus(caseId, newStatus, userId)).rejects.toThrow(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
      
      // Check that updateCase was not called
      expect(updateCase).not.toHaveBeenCalled();
      expect(createAuditLog).not.toHaveBeenCalled();
    });
  });
});
