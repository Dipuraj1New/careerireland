import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { 
  createCase, 
  getCaseById, 
  getCasesByApplicantId, 
  getCasesByAgentId, 
  getCasesByStatus, 
  updateCase, 
  deleteCase 
} from '@/services/case/caseRepository';
import { CaseStatus, CasePriority, VisaType } from '@/types/case';

// Mock the database module
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

describe('Case Repository', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createCase', () => {
    it('should create a new case', async () => {
      // Mock data
      const applicantId = uuidv4();
      const agentId = uuidv4();
      const visaType = VisaType.STUDENT;
      const priority = CasePriority.STANDARD;
      const notes = 'Test notes';
      
      // Mock database response
      const mockDbResponse = {
        rows: [{
          id: expect.any(String),
          applicant_id: applicantId,
          agent_id: agentId,
          visa_type: visaType,
          status: CaseStatus.DRAFT,
          submission_date: null,
          decision_date: null,
          priority: priority,
          notes: notes,
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
        }],
      };
      
      // Set up mock implementation
      (db.query as jest.Mock).mockResolvedValue(mockDbResponse);
      
      // Call the function
      const result = await createCase({
        applicantId,
        agentId,
        visaType,
        priority,
        notes,
      });
      
      // Check that the database was called with the correct parameters
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO cases'),
        expect.arrayContaining([
          expect.any(String), // id
          applicantId,
          agentId,
          visaType,
          CaseStatus.DRAFT,
          priority,
          notes,
          expect.any(Date), // created_at
          expect.any(Date), // updated_at
        ])
      );
      
      // Check the result
      expect(result).toEqual({
        id: expect.any(String),
        applicantId,
        agentId,
        visaType,
        status: CaseStatus.DRAFT,
        submissionDate: undefined,
        decisionDate: undefined,
        priority,
        notes,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
  
  describe('getCaseById', () => {
    it('should return a case when found', async () => {
      // Mock data
      const caseId = uuidv4();
      const applicantId = uuidv4();
      const now = new Date();
      
      // Mock database response
      const mockDbResponse = {
        rows: [{
          id: caseId,
          applicant_id: applicantId,
          agent_id: null,
          visa_type: VisaType.STUDENT,
          status: CaseStatus.DRAFT,
          submission_date: null,
          decision_date: null,
          priority: CasePriority.STANDARD,
          notes: null,
          created_at: now,
          updated_at: now,
        }],
      };
      
      // Set up mock implementation
      (db.query as jest.Mock).mockResolvedValue(mockDbResponse);
      
      // Call the function
      const result = await getCaseById(caseId);
      
      // Check that the database was called with the correct parameters
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM cases'),
        [caseId]
      );
      
      // Check the result
      expect(result).toEqual({
        id: caseId,
        applicantId,
        agentId: undefined,
        visaType: VisaType.STUDENT,
        status: CaseStatus.DRAFT,
        submissionDate: undefined,
        decisionDate: undefined,
        priority: CasePriority.STANDARD,
        notes: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
    
    it('should return null when case not found', async () => {
      // Mock database response
      const mockDbResponse = {
        rows: [],
      };
      
      // Set up mock implementation
      (db.query as jest.Mock).mockResolvedValue(mockDbResponse);
      
      // Call the function
      const result = await getCaseById(uuidv4());
      
      // Check the result
      expect(result).toBeNull();
    });
  });
  
  describe('updateCase', () => {
    it('should update case status', async () => {
      // Mock data
      const caseId = uuidv4();
      const newStatus = CaseStatus.SUBMITTED;
      const now = new Date();
      
      // Mock database response
      const mockDbResponse = {
        rows: [{
          id: caseId,
          applicant_id: uuidv4(),
          agent_id: null,
          visa_type: VisaType.STUDENT,
          status: newStatus,
          submission_date: now,
          decision_date: null,
          priority: CasePriority.STANDARD,
          notes: null,
          created_at: now,
          updated_at: now,
        }],
      };
      
      // Set up mock implementation
      (db.query as jest.Mock).mockResolvedValue(mockDbResponse);
      
      // Call the function
      const result = await updateCase(caseId, { status: newStatus });
      
      // Check that the database was called with the correct parameters
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cases'),
        expect.arrayContaining([
          newStatus,
          expect.any(Date), // submission_date
          expect.any(Date), // updated_at
          caseId,
        ])
      );
      
      // Check the result
      expect(result).toEqual({
        id: caseId,
        applicantId: expect.any(String),
        agentId: undefined,
        visaType: VisaType.STUDENT,
        status: newStatus,
        submissionDate: expect.any(Date),
        decisionDate: undefined,
        priority: CasePriority.STANDARD,
        notes: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
