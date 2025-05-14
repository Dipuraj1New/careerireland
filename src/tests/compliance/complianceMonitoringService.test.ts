import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createComplianceRequirement,
  getComplianceRequirementById,
  getComplianceRequirements,
  updateComplianceRequirementStatus,
  runComplianceCheck,
  runAllComplianceChecks,
  ComplianceRequirementType,
  ComplianceStatus
} from '@/services/compliance/complianceMonitoringService';
import { createAuditLog } from '@/services/audit/auditService';
import { sendNotification } from '@/services/notification/notificationService';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@/types/user';

// Mock dependencies
vi.mock('uuid', () => ({
  v4: vi.fn()
}));

vi.mock('@/lib/db', () => ({
  default: {
    query: vi.fn()
  }
}));

vi.mock('@/services/audit/auditService', () => ({
  createAuditLog: vi.fn()
}));

vi.mock('@/services/notification/notificationService', () => ({
  sendNotification: vi.fn()
}));

describe('Compliance Monitoring Service', () => {
  const mockUuid = '123e4567-e89b-12d3-a456-426614174000';
  
  beforeEach(() => {
    vi.resetAllMocks();
    (uuidv4 as any).mockReturnValue(mockUuid);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createComplianceRequirement', () => {
    it('should create a new compliance requirement', async () => {
      const now = new Date();
      const nextCheckDue = new Date();
      nextCheckDue.setDate(nextCheckDue.getDate() + 30);
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'GDPR Compliance',
          description: 'Ensure GDPR compliance',
          type: ComplianceRequirementType.GDPR,
          status: ComplianceStatus.UNDER_REVIEW,
          details: '{}',
          last_checked: null,
          next_check_due: nextCheckDue,
          created_at: now,
          updated_at: now
        }]
      });
      
      const result = await createComplianceRequirement(
        'GDPR Compliance',
        'Ensure GDPR compliance',
        ComplianceRequirementType.GDPR,
        {},
        'creator-id'
      );
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO compliance_requirements'),
        expect.arrayContaining([
          mockUuid,
          'GDPR Compliance',
          'Ensure GDPR compliance',
          ComplianceRequirementType.GDPR,
          ComplianceStatus.UNDER_REVIEW
        ])
      );
      
      expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'creator-id',
        entityId: mockUuid,
        details: expect.objectContaining({
          name: 'GDPR Compliance',
          type: ComplianceRequirementType.GDPR
        })
      }));
      
      expect(result).toEqual(expect.objectContaining({
        id: mockUuid,
        name: 'GDPR Compliance',
        description: 'Ensure GDPR compliance',
        type: ComplianceRequirementType.GDPR,
        status: ComplianceStatus.UNDER_REVIEW,
        details: {},
        nextCheckDue
      }));
    });
  });
  
  describe('getComplianceRequirementById', () => {
    it('should return a compliance requirement by ID', async () => {
      const now = new Date();
      const nextCheckDue = new Date();
      nextCheckDue.setDate(nextCheckDue.getDate() + 30);
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'GDPR Compliance',
          description: 'Ensure GDPR compliance',
          type: ComplianceRequirementType.GDPR,
          status: ComplianceStatus.UNDER_REVIEW,
          details: '{"key":"value"}',
          last_checked: null,
          next_check_due: nextCheckDue,
          created_at: now,
          updated_at: now
        }]
      });
      
      const result = await getComplianceRequirementById(mockUuid);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM compliance_requirements'),
        [mockUuid]
      );
      
      expect(result).toEqual(expect.objectContaining({
        id: mockUuid,
        name: 'GDPR Compliance',
        description: 'Ensure GDPR compliance',
        type: ComplianceRequirementType.GDPR,
        status: ComplianceStatus.UNDER_REVIEW,
        details: { key: 'value' },
        nextCheckDue
      }));
    });
    
    it('should return null if requirement not found', async () => {
      (db.query as any).mockResolvedValueOnce({
        rows: []
      });
      
      const result = await getComplianceRequirementById(mockUuid);
      
      expect(result).toBeNull();
    });
  });
  
  describe('getComplianceRequirements', () => {
    it('should return compliance requirements with filtering and pagination', async () => {
      const now = new Date();
      const nextCheckDue = new Date();
      nextCheckDue.setDate(nextCheckDue.getDate() + 30);
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'GDPR Compliance',
          description: 'Ensure GDPR compliance',
          type: ComplianceRequirementType.GDPR,
          status: ComplianceStatus.UNDER_REVIEW,
          details: '{"key":"value"}',
          last_checked: null,
          next_check_due: nextCheckDue,
          created_at: now,
          updated_at: now
        }]
      });
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{ count: '10' }]
      });
      
      const result = await getComplianceRequirements(
        ComplianceRequirementType.GDPR,
        ComplianceStatus.UNDER_REVIEW,
        1,
        10
      );
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM compliance_requirements'),
        expect.arrayContaining([
          ComplianceRequirementType.GDPR,
          ComplianceStatus.UNDER_REVIEW,
          10,
          0
        ])
      );
      
      expect(result).toEqual(expect.objectContaining({
        requirements: expect.arrayContaining([
          expect.objectContaining({
            id: mockUuid,
            name: 'GDPR Compliance',
            type: ComplianceRequirementType.GDPR
          })
        ]),
        pagination: {
          total: 10,
          page: 1,
          limit: 10
        }
      }));
    });
  });
  
  describe('updateComplianceRequirementStatus', () => {
    it('should update a compliance requirement status', async () => {
      const now = new Date();
      const nextCheckDue = new Date();
      nextCheckDue.setDate(nextCheckDue.getDate() + 30);
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'GDPR Compliance',
          description: 'Ensure GDPR compliance',
          type: ComplianceRequirementType.GDPR,
          status: ComplianceStatus.COMPLIANT,
          details: '{"key":"value"}',
          last_checked: now,
          next_check_due: nextCheckDue,
          created_at: now,
          updated_at: now
        }]
      });
      
      // Mock admin query for notifications (not needed for COMPLIANT status)
      
      const result = await updateComplianceRequirementStatus(
        mockUuid,
        ComplianceStatus.COMPLIANT,
        { key: 'updated' },
        'updater-id'
      );
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE compliance_requirements'),
        expect.arrayContaining([
          ComplianceStatus.COMPLIANT,
          '{"key":"updated"}',
          expect.any(Date),
          expect.any(Date),
          expect.any(Date),
          mockUuid
        ])
      );
      
      expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'updater-id',
        entityId: mockUuid,
        details: expect.objectContaining({
          status: ComplianceStatus.COMPLIANT,
          details: { key: 'updated' }
        })
      }));
      
      expect(result).toEqual(expect.objectContaining({
        id: mockUuid,
        name: 'GDPR Compliance',
        status: ComplianceStatus.COMPLIANT,
        details: { key: 'value' }
      }));
    });
    
    it('should notify admins when status is non-compliant', async () => {
      const now = new Date();
      const nextCheckDue = new Date();
      nextCheckDue.setDate(nextCheckDue.getDate() + 30);
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'GDPR Compliance',
          description: 'Ensure GDPR compliance',
          type: ComplianceRequirementType.GDPR,
          status: ComplianceStatus.NON_COMPLIANT,
          details: '{"key":"value"}',
          last_checked: now,
          next_check_due: nextCheckDue,
          created_at: now,
          updated_at: now
        }]
      });
      
      // Mock admin query for notifications
      (db.query as any).mockResolvedValueOnce({
        rows: [{ id: 'admin-id' }]
      });
      
      await updateComplianceRequirementStatus(
        mockUuid,
        ComplianceStatus.NON_COMPLIANT,
        { key: 'updated' },
        'updater-id'
      );
      
      expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'admin-id',
        title: expect.stringContaining('Compliance Issue Detected'),
        priority: 'high'
      }));
    });
    
    it('should return null if requirement not found', async () => {
      (db.query as any).mockResolvedValueOnce({
        rows: []
      });
      
      const result = await updateComplianceRequirementStatus(
        mockUuid,
        ComplianceStatus.COMPLIANT,
        { key: 'updated' },
        'updater-id'
      );
      
      expect(result).toBeNull();
    });
  });
  
  describe('runComplianceCheck', () => {
    it('should run a compliance check for a requirement', async () => {
      const now = new Date();
      
      // Mock requirement
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'GDPR Compliance',
          description: 'Ensure GDPR compliance',
          type: ComplianceRequirementType.GDPR,
          status: ComplianceStatus.UNDER_REVIEW,
          details: '{}',
          last_checked: null,
          next_check_due: now,
          created_at: now,
          updated_at: now
        }]
      });
      
      // Mock privacy policy check
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: 'policy-id',
          policy_type: 'privacy_policy',
          is_active: true
        }]
      });
      
      // Mock retention policy check
      (db.query as any).mockResolvedValueOnce({
        rows: [{ count: '5' }]
      });
      
      // Mock consent records check
      (db.query as any).mockResolvedValueOnce({
        rows: [{ count: '10' }]
      });
      
      // Mock update requirement status
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'GDPR Compliance',
          description: 'Ensure GDPR compliance',
          type: ComplianceRequirementType.GDPR,
          status: ComplianceStatus.COMPLIANT,
          details: '{"privacyPolicy":{"compliant":true,"policyId":"policy-id"},"retentionPolicies":{"compliant":true,"count":5},"consentRecords":{"compliant":true,"count":10}}',
          last_checked: now,
          next_check_due: now,
          created_at: now,
          updated_at: now
        }]
      });
      
      const result = await runComplianceCheck(mockUuid, 'checker-id');
      
      expect(result).toEqual(expect.objectContaining({
        requirementId: mockUuid,
        status: ComplianceStatus.COMPLIANT,
        details: expect.objectContaining({
          privacyPolicy: expect.objectContaining({
            compliant: true,
            policyId: 'policy-id'
          }),
          retentionPolicies: expect.objectContaining({
            compliant: true,
            count: 5
          }),
          consentRecords: expect.objectContaining({
            compliant: true,
            count: 10
          })
        })
      }));
    });
    
    it('should throw an error if requirement not found', async () => {
      (db.query as any).mockResolvedValueOnce({
        rows: []
      });
      
      await expect(runComplianceCheck(mockUuid, 'checker-id'))
        .rejects.toThrow(`Compliance requirement not found: ${mockUuid}`);
    });
  });
});
