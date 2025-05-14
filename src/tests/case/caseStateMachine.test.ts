/**
 * Case State Machine Tests
 */
import { 
  isValidTransition, 
  hasPermissionForTransition, 
  getTransitionRequirements 
} from '@/services/case/caseStateMachine';
import { CaseStatus } from '@/types/case';
import { UserRole } from '@/types/user';

describe('Case State Machine', () => {
  describe('isValidTransition', () => {
    it('should allow transition from DRAFT to SUBMITTED', () => {
      expect(isValidTransition(CaseStatus.DRAFT, CaseStatus.SUBMITTED)).toBe(true);
    });
    
    it('should allow transition from DRAFT to WITHDRAWN', () => {
      expect(isValidTransition(CaseStatus.DRAFT, CaseStatus.WITHDRAWN)).toBe(true);
    });
    
    it('should allow transition from SUBMITTED to IN_REVIEW', () => {
      expect(isValidTransition(CaseStatus.SUBMITTED, CaseStatus.IN_REVIEW)).toBe(true);
    });
    
    it('should allow transition from IN_REVIEW to ADDITIONAL_INFO_REQUIRED', () => {
      expect(isValidTransition(CaseStatus.IN_REVIEW, CaseStatus.ADDITIONAL_INFO_REQUIRED)).toBe(true);
    });
    
    it('should allow transition from IN_REVIEW to APPROVED', () => {
      expect(isValidTransition(CaseStatus.IN_REVIEW, CaseStatus.APPROVED)).toBe(true);
    });
    
    it('should allow transition from IN_REVIEW to REJECTED', () => {
      expect(isValidTransition(CaseStatus.IN_REVIEW, CaseStatus.REJECTED)).toBe(true);
    });
    
    it('should allow transition from ADDITIONAL_INFO_REQUIRED to IN_REVIEW', () => {
      expect(isValidTransition(CaseStatus.ADDITIONAL_INFO_REQUIRED, CaseStatus.IN_REVIEW)).toBe(true);
    });
    
    it('should allow transition from APPROVED to COMPLETED', () => {
      expect(isValidTransition(CaseStatus.APPROVED, CaseStatus.COMPLETED)).toBe(true);
    });
    
    it('should not allow transition from DRAFT to IN_REVIEW', () => {
      expect(isValidTransition(CaseStatus.DRAFT, CaseStatus.IN_REVIEW)).toBe(false);
    });
    
    it('should not allow transition from REJECTED to APPROVED', () => {
      expect(isValidTransition(CaseStatus.REJECTED, CaseStatus.APPROVED)).toBe(false);
    });
    
    it('should not allow transition from WITHDRAWN to SUBMITTED', () => {
      expect(isValidTransition(CaseStatus.WITHDRAWN, CaseStatus.SUBMITTED)).toBe(false);
    });
    
    it('should not allow transition from COMPLETED to any other status', () => {
      expect(isValidTransition(CaseStatus.COMPLETED, CaseStatus.DRAFT)).toBe(false);
      expect(isValidTransition(CaseStatus.COMPLETED, CaseStatus.SUBMITTED)).toBe(false);
      expect(isValidTransition(CaseStatus.COMPLETED, CaseStatus.IN_REVIEW)).toBe(false);
      expect(isValidTransition(CaseStatus.COMPLETED, CaseStatus.ADDITIONAL_INFO_REQUIRED)).toBe(false);
      expect(isValidTransition(CaseStatus.COMPLETED, CaseStatus.APPROVED)).toBe(false);
      expect(isValidTransition(CaseStatus.COMPLETED, CaseStatus.REJECTED)).toBe(false);
      expect(isValidTransition(CaseStatus.COMPLETED, CaseStatus.WITHDRAWN)).toBe(false);
    });
    
    it('should allow transition to the same status', () => {
      expect(isValidTransition(CaseStatus.DRAFT, CaseStatus.DRAFT)).toBe(true);
      expect(isValidTransition(CaseStatus.SUBMITTED, CaseStatus.SUBMITTED)).toBe(true);
      expect(isValidTransition(CaseStatus.IN_REVIEW, CaseStatus.IN_REVIEW)).toBe(true);
    });
  });
  
  describe('hasPermissionForTransition', () => {
    it('should allow applicants to submit their draft cases', () => {
      expect(hasPermissionForTransition(
        UserRole.APPLICANT, 
        CaseStatus.DRAFT, 
        CaseStatus.SUBMITTED
      )).toBe(true);
    });
    
    it('should allow applicants to withdraw their draft cases', () => {
      expect(hasPermissionForTransition(
        UserRole.APPLICANT, 
        CaseStatus.DRAFT, 
        CaseStatus.WITHDRAWN
      )).toBe(true);
    });
    
    it('should allow applicants to withdraw their submitted cases', () => {
      expect(hasPermissionForTransition(
        UserRole.APPLICANT, 
        CaseStatus.SUBMITTED, 
        CaseStatus.WITHDRAWN
      )).toBe(true);
    });
    
    it('should allow applicants to resubmit after providing additional info', () => {
      expect(hasPermissionForTransition(
        UserRole.APPLICANT, 
        CaseStatus.ADDITIONAL_INFO_REQUIRED, 
        CaseStatus.IN_REVIEW
      )).toBe(true);
    });
    
    it('should not allow applicants to approve cases', () => {
      expect(hasPermissionForTransition(
        UserRole.APPLICANT, 
        CaseStatus.IN_REVIEW, 
        CaseStatus.APPROVED
      )).toBe(false);
    });
    
    it('should allow agents to move submitted cases to in_review', () => {
      expect(hasPermissionForTransition(
        UserRole.AGENT, 
        CaseStatus.SUBMITTED, 
        CaseStatus.IN_REVIEW
      )).toBe(true);
    });
    
    it('should allow agents to request additional info', () => {
      expect(hasPermissionForTransition(
        UserRole.AGENT, 
        CaseStatus.IN_REVIEW, 
        CaseStatus.ADDITIONAL_INFO_REQUIRED
      )).toBe(true);
    });
    
    it('should allow agents to approve cases', () => {
      expect(hasPermissionForTransition(
        UserRole.AGENT, 
        CaseStatus.IN_REVIEW, 
        CaseStatus.APPROVED
      )).toBe(true);
    });
    
    it('should allow agents to reject cases', () => {
      expect(hasPermissionForTransition(
        UserRole.AGENT, 
        CaseStatus.IN_REVIEW, 
        CaseStatus.REJECTED
      )).toBe(true);
    });
    
    it('should allow admins to make any valid transition', () => {
      expect(hasPermissionForTransition(
        UserRole.ADMIN, 
        CaseStatus.DRAFT, 
        CaseStatus.SUBMITTED
      )).toBe(true);
      
      expect(hasPermissionForTransition(
        UserRole.ADMIN, 
        CaseStatus.SUBMITTED, 
        CaseStatus.IN_REVIEW
      )).toBe(true);
      
      expect(hasPermissionForTransition(
        UserRole.ADMIN, 
        CaseStatus.IN_REVIEW, 
        CaseStatus.APPROVED
      )).toBe(true);
    });
  });
  
  describe('getTransitionRequirements', () => {
    it('should require notes for transitions to ADDITIONAL_INFO_REQUIRED', () => {
      const requirements = getTransitionRequirements(
        CaseStatus.IN_REVIEW, 
        CaseStatus.ADDITIONAL_INFO_REQUIRED
      );
      
      expect(requirements.requiresNotes).toBe(true);
    });
    
    it('should require notes for transitions to APPROVED', () => {
      const requirements = getTransitionRequirements(
        CaseStatus.IN_REVIEW, 
        CaseStatus.APPROVED
      );
      
      expect(requirements.requiresNotes).toBe(true);
    });
    
    it('should require notes for transitions to REJECTED', () => {
      const requirements = getTransitionRequirements(
        CaseStatus.IN_REVIEW, 
        CaseStatus.REJECTED
      );
      
      expect(requirements.requiresNotes).toBe(true);
    });
    
    it('should update submission date for transitions from DRAFT to SUBMITTED', () => {
      const requirements = getTransitionRequirements(
        CaseStatus.DRAFT, 
        CaseStatus.SUBMITTED
      );
      
      expect(requirements.updateSubmissionDate).toBe(true);
    });
    
    it('should update decision date for transitions to APPROVED', () => {
      const requirements = getTransitionRequirements(
        CaseStatus.IN_REVIEW, 
        CaseStatus.APPROVED
      );
      
      expect(requirements.updateDecisionDate).toBe(true);
    });
    
    it('should update decision date for transitions to REJECTED', () => {
      const requirements = getTransitionRequirements(
        CaseStatus.IN_REVIEW, 
        CaseStatus.REJECTED
      );
      
      expect(requirements.updateDecisionDate).toBe(true);
    });
    
    it('should notify applicant for all transitions', () => {
      const requirements = getTransitionRequirements(
        CaseStatus.DRAFT, 
        CaseStatus.SUBMITTED
      );
      
      expect(requirements.notifyApplicant).toBe(true);
    });
    
    it('should notify agent for all transitions', () => {
      const requirements = getTransitionRequirements(
        CaseStatus.DRAFT, 
        CaseStatus.SUBMITTED
      );
      
      expect(requirements.notifyAgent).toBe(true);
    });
  });
});
