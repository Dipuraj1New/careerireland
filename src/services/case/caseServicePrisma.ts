import prisma from '@/lib/prisma';
import {
  Case,
  CaseStatus,
  CasePriority,
  VisaType,
  CaseCreateData,
  CaseUpdateData,
  CaseWithRelations
} from '@/types/case';
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
    const newCase = await prisma.case.create({
      data: {
        title: caseData.title,
        description: caseData.description,
        visaType: caseData.visaType,
        status: CaseStatus.DRAFT,
        priority: caseData.priority || CasePriority.MEDIUM,
        applicant: {
          connect: {
            id: caseData.applicantId,
          },
        },
      },
    });

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
export async function getCaseWithDocuments(id: string): Promise<CaseWithRelations | null> {
  try {
    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            nationality: true,
            dateOfBirth: true,
          },
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        documents: true,
      },
    });

    return caseData as CaseWithRelations;
  } catch (error) {
    console.error('Error getting case with documents:', error);
    throw error;
  }
}

/**
 * Get case by ID
 */
export async function getCaseById(id: string): Promise<Case | null> {
  try {
    return await prisma.case.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error getting case by ID:', error);
    throw error;
  }
}

/**
 * Get cases by applicant ID
 */
export async function getApplicantCases(applicantId: string): Promise<Case[]> {
  try {
    return await prisma.case.findMany({
      where: { applicantId },
      orderBy: { updatedAt: 'desc' },
    });
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
    return await prisma.case.findMany({
      where: { agentId },
      orderBy: { updatedAt: 'desc' },
    });
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
    const currentCase = await getCaseById(id);

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
    const updateData: any = {
      status,
    };

    // Handle special status transitions
    if (status === CaseStatus.SUBMITTED) {
      updateData.submittedAt = new Date();
    } else if (status === CaseStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData,
    });

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
    const currentCase = await getCaseById(id);

    if (!currentCase) {
      return null;
    }

    // Update case
    const updatedCase = await prisma.case.update({
      where: { id },
      data: {
        agent: agentId ? {
          connect: { id: agentId }
        } : {
          disconnect: true
        }
      },
    });

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
    const currentCase = await getCaseById(id);

    if (!currentCase) {
      return null;
    }

    // Update case
    const updatedCase = await prisma.case.update({
      where: { id },
      data: { priority },
    });

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
