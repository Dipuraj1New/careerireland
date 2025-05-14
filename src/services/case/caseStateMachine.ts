/**
 * Case State Machine
 * 
 * Defines the valid transitions between case statuses and provides
 * validation functions for status transitions.
 */
import { CaseStatus, Case } from '@/types/case';
import { UserRole } from '@/types/user';

// Define valid transitions for each status
const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  [CaseStatus.DRAFT]: [
    CaseStatus.SUBMITTED,
    CaseStatus.WITHDRAWN
  ],
  [CaseStatus.SUBMITTED]: [
    CaseStatus.IN_REVIEW,
    CaseStatus.WITHDRAWN
  ],
  [CaseStatus.IN_REVIEW]: [
    CaseStatus.ADDITIONAL_INFO_REQUIRED,
    CaseStatus.APPROVED,
    CaseStatus.REJECTED,
    CaseStatus.WITHDRAWN
  ],
  [CaseStatus.ADDITIONAL_INFO_REQUIRED]: [
    CaseStatus.IN_REVIEW,
    CaseStatus.WITHDRAWN
  ],
  [CaseStatus.APPROVED]: [
    CaseStatus.COMPLETED
  ],
  [CaseStatus.REJECTED]: [
    // No further transitions allowed
  ],
  [CaseStatus.WITHDRAWN]: [
    // No further transitions allowed
  ],
  [CaseStatus.COMPLETED]: [
    // No further transitions allowed
  ]
};

// Define role-based permissions for status transitions
const ROLE_PERMISSIONS: Record<UserRole, Record<CaseStatus, boolean>> = {
  [UserRole.APPLICANT]: {
    [CaseStatus.DRAFT]: true, // Applicants can submit or withdraw their draft cases
    [CaseStatus.SUBMITTED]: true, // Applicants can withdraw their submitted cases
    [CaseStatus.IN_REVIEW]: false,
    [CaseStatus.ADDITIONAL_INFO_REQUIRED]: true, // Applicants can resubmit after providing additional info
    [CaseStatus.APPROVED]: false,
    [CaseStatus.REJECTED]: false,
    [CaseStatus.WITHDRAWN]: false,
    [CaseStatus.COMPLETED]: false
  },
  [UserRole.AGENT]: {
    [CaseStatus.DRAFT]: false,
    [CaseStatus.SUBMITTED]: true, // Agents can move submitted cases to in_review
    [CaseStatus.IN_REVIEW]: true, // Agents can request additional info, approve, or reject
    [CaseStatus.ADDITIONAL_INFO_REQUIRED]: true, // Agents can move back to in_review
    [CaseStatus.APPROVED]: true, // Agents can mark as completed
    [CaseStatus.REJECTED]: false,
    [CaseStatus.WITHDRAWN]: false,
    [CaseStatus.COMPLETED]: false
  },
  [UserRole.EXPERT]: {
    [CaseStatus.DRAFT]: false,
    [CaseStatus.SUBMITTED]: true,
    [CaseStatus.IN_REVIEW]: true,
    [CaseStatus.ADDITIONAL_INFO_REQUIRED]: true,
    [CaseStatus.APPROVED]: true,
    [CaseStatus.REJECTED]: false,
    [CaseStatus.WITHDRAWN]: false,
    [CaseStatus.COMPLETED]: false
  },
  [UserRole.ADMIN]: {
    [CaseStatus.DRAFT]: true, // Admins can change any status
    [CaseStatus.SUBMITTED]: true,
    [CaseStatus.IN_REVIEW]: true,
    [CaseStatus.ADDITIONAL_INFO_REQUIRED]: true,
    [CaseStatus.APPROVED]: true,
    [CaseStatus.REJECTED]: true,
    [CaseStatus.WITHDRAWN]: true,
    [CaseStatus.COMPLETED]: true
  }
};

/**
 * Check if a status transition is valid
 * @param currentStatus Current case status
 * @param newStatus New case status
 * @returns True if the transition is valid, false otherwise
 */
export function isValidTransition(currentStatus: CaseStatus, newStatus: CaseStatus): boolean {
  // If the status is not changing, it's always valid
  if (currentStatus === newStatus) {
    return true;
  }
  
  // Check if the new status is in the list of valid transitions
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}

/**
 * Check if a user has permission to make a status transition
 * @param userRole User role
 * @param currentStatus Current case status
 * @param newStatus New case status
 * @returns True if the user has permission, false otherwise
 */
export function hasPermissionForTransition(
  userRole: UserRole,
  currentStatus: CaseStatus,
  newStatus: CaseStatus
): boolean {
  // If the status is not changing, check if the user has permission for the current status
  if (currentStatus === newStatus) {
    return ROLE_PERMISSIONS[userRole][currentStatus];
  }
  
  // Check if the transition is valid
  if (!isValidTransition(currentStatus, newStatus)) {
    return false;
  }
  
  // Check if the user has permission for the current status
  return ROLE_PERMISSIONS[userRole][currentStatus];
}

/**
 * Get special handling requirements for a status transition
 * @param currentStatus Current case status
 * @param newStatus New case status
 * @returns Object with special handling flags
 */
export function getTransitionRequirements(
  currentStatus: CaseStatus,
  newStatus: CaseStatus
): { 
  requiresNotes: boolean;
  updateSubmissionDate: boolean;
  updateDecisionDate: boolean;
  notifyApplicant: boolean;
  notifyAgent: boolean;
} {
  // Default requirements
  const requirements = {
    requiresNotes: false,
    updateSubmissionDate: false,
    updateDecisionDate: false,
    notifyApplicant: true, // Notify applicant by default for all transitions
    notifyAgent: true // Notify agent by default for all transitions
  };
  
  // Special handling for specific transitions
  if (currentStatus === CaseStatus.DRAFT && newStatus === CaseStatus.SUBMITTED) {
    requirements.updateSubmissionDate = true;
  }
  
  if (newStatus === CaseStatus.APPROVED || newStatus === CaseStatus.REJECTED) {
    requirements.requiresNotes = true;
    requirements.updateDecisionDate = true;
  }
  
  if (newStatus === CaseStatus.ADDITIONAL_INFO_REQUIRED) {
    requirements.requiresNotes = true;
  }
  
  return requirements;
}

export default {
  isValidTransition,
  hasPermissionForTransition,
  getTransitionRequirements
};
