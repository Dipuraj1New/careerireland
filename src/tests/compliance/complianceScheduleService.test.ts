import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  scheduleComplianceCheck,
  getScheduledComplianceChecks,
  updateScheduledComplianceCheck,
  deleteScheduledComplianceCheck,
  ComplianceCheckFrequency
} from '@/services/compliance/complianceScheduleService';
import { getComplianceRequirementById } from '@/services/compliance/complianceMonitoringService';
import { createAuditLog } from '@/services/audit/auditService';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
vi.mock('uuid', () => ({
  v4: vi.fn()
}));

vi.mock('@/lib/db', () => ({
  default: {
    query: vi.fn()
  }
}));

vi.mock('@/services/compliance/complianceMonitoringService', () => ({
  getComplianceRequirementById: vi.fn()
}));

vi.mock('@/services/audit/auditService', () => ({
  createAuditLog: vi.fn()
}));

describe('Compliance Schedule Service', () => {
  const mockUuid = '123e4567-e89b-12d3-a456-426614174000';
  const mockRequirementId = '123e4567-e89b-12d3-a456-426614174001';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174002';
  const mockEmail = 'admin@example.com';
  
  beforeEach(() => {
    vi.resetAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue(mockUuid);
    
    // Mock getComplianceRequirementById
    (getComplianceRequirementById as jest.Mock).mockResolvedValue({
      id: mockRequirementId,
      name: 'Test Requirement',
      description: 'Test Description',
      type: 'gdpr',
      status: 'compliant'
    });
    
    // Mock db.query for scheduleComplianceCheck
    (db.query as jest.Mock).mockResolvedValue({
      rows: [{
        id: mockUuid,
        requirement_id: mockRequirementId,
        frequency: 'weekly',
        next_run_date: new Date(),
        last_run_date: null,
        notify_email: mockEmail,
        created_by: mockUserId,
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true
      }]
    });
  });
  
  describe('scheduleComplianceCheck', () => {
    it('should schedule a compliance check', async () => {
      const result = await scheduleComplianceCheck(
        mockRequirementId,
        ComplianceCheckFrequency.WEEKLY,
        mockUserId,
        mockEmail
      );
      
      expect(getComplianceRequirementById).toHaveBeenCalledWith(mockRequirementId);
      expect(db.query).toHaveBeenCalled();
      expect(createAuditLog).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUuid);
      expect(result.requirementId).toBe(mockRequirementId);
      expect(result.frequency).toBe(ComplianceCheckFrequency.WEEKLY);
      expect(result.notifyEmail).toBe(mockEmail);
    });
    
    it('should throw an error if requirement does not exist', async () => {
      (getComplianceRequirementById as jest.Mock).mockResolvedValue(null);
      
      await expect(scheduleComplianceCheck(
        mockRequirementId,
        ComplianceCheckFrequency.WEEKLY,
        mockUserId,
        mockEmail
      )).rejects.toThrow(`Compliance requirement with ID ${mockRequirementId} not found`);
    });
  });
  
  describe('getScheduledComplianceChecks', () => {
    it('should get scheduled compliance checks with pagination', async () => {
      (db.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('COUNT(*)')) {
          return { rows: [{ count: '5' }] };
        } else {
          return {
            rows: [
              {
                id: mockUuid,
                requirement_id: mockRequirementId,
                requirement_name: 'Test Requirement',
                frequency: 'weekly',
                next_run_date: new Date(),
                last_run_date: null,
                notify_email: mockEmail,
                created_by: mockUserId,
                created_at: new Date(),
                updated_at: new Date(),
                is_active: true
              }
            ]
          };
        }
      });
      
      const result = await getScheduledComplianceChecks(1, 10);
      
      expect(db.query).toHaveBeenCalledTimes(2);
      expect(result.schedules).toHaveLength(1);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
    
    it('should filter by requirement ID if provided', async () => {
      (db.query as jest.Mock).mockImplementation((query) => {
        if (query.includes('COUNT(*)')) {
          return { rows: [{ count: '1' }] };
        } else {
          return {
            rows: [
              {
                id: mockUuid,
                requirement_id: mockRequirementId,
                requirement_name: 'Test Requirement',
                frequency: 'weekly',
                next_run_date: new Date(),
                last_run_date: null,
                notify_email: mockEmail,
                created_by: mockUserId,
                created_at: new Date(),
                updated_at: new Date(),
                is_active: true
              }
            ]
          };
        }
      });
      
      const result = await getScheduledComplianceChecks(1, 10, mockRequirementId);
      
      expect(db.query).toHaveBeenCalledTimes(2);
      expect(result.schedules).toHaveLength(1);
      expect(result.schedules[0].requirementId).toBe(mockRequirementId);
    });
  });
  
  describe('updateScheduledComplianceCheck', () => {
    it('should update a scheduled compliance check', async () => {
      const updates = {
        frequency: ComplianceCheckFrequency.MONTHLY,
        notifyEmail: 'newemail@example.com',
        isActive: false
      };
      
      const result = await updateScheduledComplianceCheck(
        mockUuid,
        updates,
        mockUserId
      );
      
      expect(db.query).toHaveBeenCalled();
      expect(createAuditLog).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
    
    it('should return null if no schedule is found', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await updateScheduledComplianceCheck(
        mockUuid,
        { isActive: false },
        mockUserId
      );
      
      expect(result).toBeNull();
    });
  });
  
  describe('deleteScheduledComplianceCheck', () => {
    it('should delete a scheduled compliance check', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: mockUuid }] });
      
      const result = await deleteScheduledComplianceCheck(
        mockUuid,
        mockUserId
      );
      
      expect(db.query).toHaveBeenCalled();
      expect(createAuditLog).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should return false if no schedule is found', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });
      
      const result = await deleteScheduledComplianceCheck(
        mockUuid,
        mockUserId
      );
      
      expect(result).toBe(false);
    });
  });
});
