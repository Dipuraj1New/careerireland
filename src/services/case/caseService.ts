import {
  Case,
  CaseStatus,
  CasePriority,
  VisaType,
  CaseCreateData,
  CaseUpdateData
} from '@/types/case';
import {
  createCase,
  getCaseById as getCase,
  getCasesByApplicantId,
  getCasesByAgentId,
  getCasesByStatus,
  updateCase,
  deleteCase
} from './caseRepository';

// Re-export getCaseById for external use
export const getCaseById = getCase;
import { getDocumentsByCase } from '@/services/document/documentService';
import { createAuditLog } from '@/services/audit/auditService';
import { createCaseStatusNotification } from '@/services/notification/notificationService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import { UserRole } from '@/types/user';
import caseStateMachine from './caseStateMachine';

/**
 * Create a new case
 */
export async function createNewCase(
  caseData: CaseCreateData,
  userId: string
): Promise<Case> {
  try {
    // Create case in database
    const newCase = await createCase(caseData);

    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.CASE,
      entityId: newCase.id,
      action: AuditAction.CREATE,
      details: {
        visaType: newCase.visaType,
        priority: newCase.priority,
      },
    });

    return newCase;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
}

/**
 * Get case by ID with documents
 */
export async function getCaseWithDocuments(id: string): Promise<Case & { documents: any[] } | null> {
  try {
    const caseData = await getCase(id);

    if (!caseData) {
      return null;
    }

    // Get documents for the case
    const documents = await getDocumentsByCase(id);

    return {
      ...caseData,
      documents,
    };
  } catch (error) {
    console.error('Error getting case with documents:', error);
    throw error;
  }
}

/**
 * Get cases by applicant ID
 */
export async function getApplicantCases(applicantId: string): Promise<Case[]> {
  try {
    return await getCasesByApplicantId(applicantId);
  } catch (error) {
    console.error('Error getting applicant cases:', error);
    throw error;
  }
}

/**
 * Get cases by agent ID
 */
export async function getAgentCases(agentId: string): Promise<Case[]> {
  try {
    return await getCasesByAgentId(agentId);
  } catch (error) {
    console.error('Error getting agent cases:', error);
    throw error;
  }
}

/**
 * Update case status
 */
export async function updateCaseStatus(
  id: string,
  status: CaseStatus,
  userId: string,
  userRole: UserRole,
  notes?: string
): Promise<Case | null> {
  try {
    // Get current case data
    const currentCase = await getCase(id);

    if (!currentCase) {
      return null;
    }

    // If status is not changing, return current case
    if (currentCase.status === status) {
      return currentCase;
    }

    // Validate status transition using state machine
    if (!caseStateMachine.isValidTransition(currentCase.status, status)) {
      throw new Error(`Invalid status transition from ${currentCase.status} to ${status}`);
    }

    // Check if user has permission for this transition
    if (!caseStateMachine.hasPermissionForTransition(userRole, currentCase.status, status)) {
      throw new Error(`User does not have permission to change status from ${currentCase.status} to ${status}`);
    }

    // Get special handling requirements for this transition
    const requirements = caseStateMachine.getTransitionRequirements(currentCase.status, status);

    // Check if notes are required but not provided
    if (requirements.requiresNotes && (!notes || notes.trim() === '')) {
      throw new Error(`Notes are required for status transition from ${currentCase.status} to ${status}`);
    }

    // Update case
    const updateData: CaseUpdateData = {
      status,
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedCase = await updateCase(id, updateData);

    if (!updatedCase) {
      return null;
    }

    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.CASE,
      entityId: id,
      action: AuditAction.UPDATE_STATUS,
      details: {
        previousStatus: currentCase.status,
        newStatus: status,
        notes,
        timestamp: new Date().toISOString(),
      },
    });

    // Create notifications
    await createCaseStatusNotification(id, currentCase.status, status);

    return updatedCase;
  } catch (error) {
    console.error('Error updating case status:', error);
    throw error;
  }
}

/**
 * Assign case to agent
 */
export async function assignCaseToAgent(
  id: string,
  agentId: string | null,
  userId: string
): Promise<Case | null> {
  try {
    // Get current case data
    const currentCase = await getCase(id);

    if (!currentCase) {
      return null;
    }

    // Update case
    const updatedCase = await updateCase(id, { agentId });

    if (!updatedCase) {
      return null;
    }

    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.CASE,
      entityId: id,
      action: AuditAction.ASSIGN_AGENT,
      details: {
        previousAgentId: currentCase.agentId,
        newAgentId: agentId,
      },
    });

    return updatedCase;
  } catch (error) {
    console.error('Error assigning case to agent:', error);
    throw error;
  }
}

/**
 * Update case priority
 */
export async function updateCasePriority(
  id: string,
  priority: CasePriority,
  userId: string
): Promise<Case | null> {
  try {
    // Get current case data
    const currentCase = await getCase(id);

    if (!currentCase) {
      return null;
    }

    // Update case
    const updatedCase = await updateCase(id, { priority });

    if (!updatedCase) {
      return null;
    }

    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.CASE,
      entityId: id,
      action: AuditAction.UPDATE_PRIORITY,
      details: {
        previousPriority: currentCase.priority,
        newPriority: priority,
      },
    });

    return updatedCase;
  } catch (error) {
    console.error('Error updating case priority:', error);
    throw error;
  }
}

/**
 * Submit case
 */
export async function submitCase(
  id: string,
  userId: string,
  userRole: UserRole
): Promise<Case | null> {
  try {
    return await updateCaseStatus(
      id,
      CaseStatus.SUBMITTED,
      userId,
      userRole,
      'Case submitted by applicant'
    );
  } catch (error) {
    console.error('Error submitting case:', error);
    throw error;
  }
}


