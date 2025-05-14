import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  checkAccess,
  ResourceType,
  ActionType
} from '@/services/security/attributeBasedAccessService';
import { getPermissionsForUser } from '@/services/security/accessControlService';
import db from '@/lib/db';
import { UserRole } from '@/types/user';
import { CaseStatus } from '@/types/case';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  default: {
    query: vi.fn(),
    getClient: vi.fn()
  }
}));

vi.mock('@/services/security/accessControlService', () => ({
  getPermissionsForUser: vi.fn()
}));

describe('Attribute-Based Access Control Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAccess', () => {
    it('should allow admin access to any resource', async () => {
      // Mock user as admin
      (db.query as any).mockResolvedValueOnce({
        rows: [{ id: 'admin-id', role: UserRole.ADMIN }]
      });
      
      // Mock permissions
      (getPermissionsForUser as any).mockResolvedValueOnce(['user:read']);
      
      const result = await checkAccess(
        'admin-id',
        ResourceType.USER,
        'user-id',
        ActionType.READ
      );
      
      expect(result.allowed).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['admin-id']
      );
    });
    
    it('should allow users to access their own profile', async () => {
      const userId = 'user-id';
      
      // Mock user
      (db.query as any).mockResolvedValueOnce({
        rows: [{ id: userId, role: UserRole.APPLICANT }]
      });
      
      // Mock permissions
      (getPermissionsForUser as any).mockResolvedValueOnce([]);
      
      const result = await checkAccess(
        userId,
        ResourceType.USER,
        userId,
        ActionType.READ
      );
      
      expect(result.allowed).toBe(true);
    });
    
    it('should deny access if user does not have required permission', async () => {
      // Mock user
      (db.query as any).mockResolvedValueOnce({
        rows: [{ id: 'user-id', role: UserRole.APPLICANT }]
      });
      
      // Mock permissions (empty array means no permissions)
      (getPermissionsForUser as any).mockResolvedValueOnce([]);
      
      const result = await checkAccess(
        'user-id',
        ResourceType.USER,
        'other-user-id',
        ActionType.READ
      );
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
    
    it('should allow access if user has the required permission', async () => {
      // Mock user
      (db.query as any).mockResolvedValueOnce({
        rows: [{ id: 'user-id', role: UserRole.AGENT }]
      });
      
      // Mock permissions
      (getPermissionsForUser as any).mockResolvedValueOnce(['user:read']);
      
      const result = await checkAccess(
        'user-id',
        ResourceType.USER,
        'other-user-id',
        ActionType.READ
      );
      
      expect(result.allowed).toBe(true);
    });
    
    it('should check case access for applicants', async () => {
      const userId = 'applicant-id';
      const caseId = 'case-id';
      
      // Mock user
      (db.query as any).mockResolvedValueOnce({
        rows: [{ id: userId, role: UserRole.APPLICANT }]
      });
      
      // Mock permissions
      (getPermissionsForUser as any).mockResolvedValueOnce(['case:read:self']);
      
      // Mock case data
      (db.query as any).mockResolvedValueOnce({
        rows: [{ 
          id: caseId, 
          applicant_id: userId, 
          status: CaseStatus.DRAFT 
        }]
      });
      
      const result = await checkAccess(
        userId,
        ResourceType.CASE,
        caseId,
        ActionType.READ
      );
      
      expect(result.allowed).toBe(true);
    });
    
    it('should deny case access for applicants if not their case', async () => {
      const userId = 'applicant-id';
      const caseId = 'case-id';
      
      // Mock user
      (db.query as any).mockResolvedValueOnce({
        rows: [{ id: userId, role: UserRole.APPLICANT }]
      });
      
      // Mock permissions
      (getPermissionsForUser as any).mockResolvedValueOnce(['case:read:self']);
      
      // Mock case data (different applicant_id)
      (db.query as any).mockResolvedValueOnce({
        rows: [{ 
          id: caseId, 
          applicant_id: 'different-applicant-id', 
          status: CaseStatus.DRAFT 
        }]
      });
      
      const result = await checkAccess(
        userId,
        ResourceType.CASE,
        caseId,
        ActionType.READ
      );
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Applicants can only access their own cases');
    });
    
    it('should check document access for agents', async () => {
      const userId = 'agent-id';
      const documentId = 'document-id';
      
      // Mock user
      (db.query as any).mockResolvedValueOnce({
        rows: [{ id: userId, role: UserRole.AGENT }]
      });
      
      // Mock permissions
      (getPermissionsForUser as any).mockResolvedValueOnce(['document:read']);
      
      // Mock document data
      (db.query as any).mockResolvedValueOnce({
        rows: [{ 
          id: documentId, 
          case_id: 'case-id',
          applicant_id: 'applicant-id',
          agent_id: userId
        }]
      });
      
      const result = await checkAccess(
        userId,
        ResourceType.DOCUMENT,
        documentId,
        ActionType.READ
      );
      
      expect(result.allowed).toBe(true);
    });
    
    it('should deny document access for agents if not assigned to the case', async () => {
      const userId = 'agent-id';
      const documentId = 'document-id';
      
      // Mock user
      (db.query as any).mockResolvedValueOnce({
        rows: [{ id: userId, role: UserRole.AGENT }]
      });
      
      // Mock permissions
      (getPermissionsForUser as any).mockResolvedValueOnce(['document:read']);
      
      // Mock document data (different agent_id)
      (db.query as any).mockResolvedValueOnce({
        rows: [{ 
          id: documentId, 
          case_id: 'case-id',
          applicant_id: 'applicant-id',
          agent_id: 'different-agent-id'
        }]
      });
      
      const result = await checkAccess(
        userId,
        ResourceType.DOCUMENT,
        documentId,
        ActionType.READ
      );
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Agents can only access documents for cases assigned to them');
    });
  });
});
