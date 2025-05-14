/**
 * Portal integration service for government portal integration
 */
import * as portalRepository from '../../repositories/portalRepository';
import * as formSubmissionRepository from '../../repositories/formSubmissionRepository';
import * as formTemplateRepository from '../../repositories/formTemplateRepository';
import * as portalAutomationService from './portalAutomationService';
import { createAuditLog } from '../auditLogService';
import { AuditAction, AuditEntityType } from '../../types/audit';
import {
  GovernmentPortalType,
  PortalFieldMapping,
  PortalFieldMappingCreateData,
  PortalFieldMappingUpdateData,
  PortalSubmission,
  PortalSubmissionCreateData,
  PortalSubmissionStatus,
} from '../../types/portal';
import { FormSubmissionStatus } from '../../types/form';
import config from '../../lib/config';

/**
 * Get field mappings for a portal type
 */
export async function getFieldMappings(
  portalType: GovernmentPortalType
): Promise<PortalFieldMapping[]> {
  return portalRepository.getFieldMappingsByPortalType(portalType);
}

/**
 * Create a field mapping
 */
export async function createFieldMapping(
  data: PortalFieldMappingCreateData,
  userId: string
): Promise<{ success: boolean; mapping?: PortalFieldMapping; message?: string }> {
  try {
    const mapping = await portalRepository.createFieldMapping(data);
    
    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.PORTAL_FIELD_MAPPING,
      entityId: mapping.id,
      action: AuditAction.CREATE,
      details: {
        portalType: data.portalType,
        formField: data.formField,
        portalField: data.portalField,
      },
    });
    
    return {
      success: true,
      mapping,
    };
  } catch (error) {
    console.error('Error creating field mapping:', error);
    return {
      success: false,
      message: `Failed to create field mapping: ${error.message}`,
    };
  }
}

/**
 * Update a field mapping
 */
export async function updateFieldMapping(
  id: string,
  data: PortalFieldMappingUpdateData,
  userId: string
): Promise<{ success: boolean; mapping?: PortalFieldMapping; message?: string }> {
  try {
    const mapping = await portalRepository.updateFieldMapping(id, data);
    
    if (!mapping) {
      return {
        success: false,
        message: 'Field mapping not found',
      };
    }
    
    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.PORTAL_FIELD_MAPPING,
      entityId: id,
      action: AuditAction.UPDATE,
      details: {
        portalField: data.portalField,
      },
    });
    
    return {
      success: true,
      mapping,
    };
  } catch (error) {
    console.error('Error updating field mapping:', error);
    return {
      success: false,
      message: `Failed to update field mapping: ${error.message}`,
    };
  }
}

/**
 * Delete a field mapping
 */
export async function deleteFieldMapping(
  id: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const deleted = await portalRepository.deleteFieldMapping(id);
    
    if (!deleted) {
      return {
        success: false,
        message: 'Field mapping not found',
      };
    }
    
    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.PORTAL_FIELD_MAPPING,
      entityId: id,
      action: AuditAction.DELETE,
      details: {},
    });
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting field mapping:', error);
    return {
      success: false,
      message: `Failed to delete field mapping: ${error.message}`,
    };
  }
}

/**
 * Submit form to government portal
 */
export async function submitFormToPortal(
  formSubmissionId: string,
  userId: string
): Promise<{ success: boolean; submission?: PortalSubmission; message?: string }> {
  try {
    // Get form submission
    const formSubmission = await formSubmissionRepository.getFormSubmissionById(formSubmissionId);
    
    if (!formSubmission) {
      return {
        success: false,
        message: 'Form submission not found',
      };
    }
    
    // Check if form submission is already submitted
    if (formSubmission.status === FormSubmissionStatus.SUBMITTED) {
      return {
        success: false,
        message: 'Form is already submitted',
      };
    }
    
    // Get form template
    const template = await formTemplateRepository.getFormTemplateById(formSubmission.templateId);
    
    if (!template) {
      return {
        success: false,
        message: 'Form template not found',
      };
    }
    
    // Determine portal type based on template
    // This is a simplified implementation - in a real system, you would have a more sophisticated mapping
    let portalType: GovernmentPortalType;
    
    if (template.name.includes('Immigration')) {
      portalType = GovernmentPortalType.IRISH_IMMIGRATION;
    } else if (template.name.includes('Visa')) {
      portalType = GovernmentPortalType.IRISH_VISA;
    } else if (template.name.includes('GNIB')) {
      portalType = GovernmentPortalType.GNIB;
    } else if (template.name.includes('Employment')) {
      portalType = GovernmentPortalType.EMPLOYMENT_PERMIT;
    } else {
      return {
        success: false,
        message: 'Unable to determine portal type for this form template',
      };
    }
    
    // Check if portal submission already exists
    let portalSubmission = await portalRepository.getPortalSubmissionByFormSubmissionId(formSubmissionId);
    
    if (!portalSubmission) {
      // Create portal submission
      const createData: PortalSubmissionCreateData = {
        formSubmissionId,
        portalType,
      };
      
      portalSubmission = await portalRepository.createPortalSubmission(createData);
      
      // Create audit log
      await createAuditLog({
        userId,
        entityType: AuditEntityType.PORTAL_SUBMISSION,
        entityId: portalSubmission.id,
        action: AuditAction.CREATE,
        details: {
          formSubmissionId,
          portalType,
        },
      });
    } else if (
      portalSubmission.status !== PortalSubmissionStatus.PENDING &&
      portalSubmission.status !== PortalSubmissionStatus.FAILED &&
      portalSubmission.status !== PortalSubmissionStatus.RETRYING
    ) {
      return {
        success: false,
        message: `Portal submission is already in ${portalSubmission.status} status`,
      };
    }
    
    // Update form submission status
    await formSubmissionRepository.updateFormSubmissionStatus(
      formSubmissionId,
      FormSubmissionStatus.SUBMITTED
    );
    
    // Submit form to portal asynchronously
    // In a production environment, this would be handled by a background job
    setTimeout(() => {
      portalAutomationService.submitFormToPortal(portalSubmission!.id, userId)
        .catch(error => {
          console.error('Error submitting form to portal:', error);
        });
    }, 0);
    
    return {
      success: true,
      submission: portalSubmission,
    };
  } catch (error) {
    console.error('Error submitting form to portal:', error);
    return {
      success: false,
      message: `Failed to submit form to portal: ${error.message}`,
    };
  }
}

/**
 * Get portal submission status
 */
export async function getPortalSubmissionStatus(
  formSubmissionId: string
): Promise<{ success: boolean; submission?: PortalSubmission; message?: string }> {
  try {
    const submission = await portalRepository.getPortalSubmissionByFormSubmissionId(formSubmissionId);
    
    if (!submission) {
      return {
        success: false,
        message: 'Portal submission not found',
      };
    }
    
    return {
      success: true,
      submission,
    };
  } catch (error) {
    console.error('Error getting portal submission status:', error);
    return {
      success: false,
      message: `Failed to get portal submission status: ${error.message}`,
    };
  }
}

/**
 * Retry failed portal submission
 */
export async function retryPortalSubmission(
  portalSubmissionId: string,
  userId: string
): Promise<{ success: boolean; submission?: PortalSubmission; message?: string }> {
  try {
    const submission = await portalRepository.getPortalSubmissionById(portalSubmissionId);
    
    if (!submission) {
      return {
        success: false,
        message: 'Portal submission not found',
      };
    }
    
    if (
      submission.status !== PortalSubmissionStatus.FAILED &&
      submission.status !== PortalSubmissionStatus.RETRYING
    ) {
      return {
        success: false,
        message: `Cannot retry submission with status ${submission.status}`,
      };
    }
    
    // Update submission status
    const updatedSubmission = await portalRepository.updatePortalSubmission(
      portalSubmissionId,
      {
        status: PortalSubmissionStatus.RETRYING,
      }
    );
    
    if (!updatedSubmission) {
      return {
        success: false,
        message: 'Failed to update submission status',
      };
    }
    
    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.PORTAL_SUBMISSION,
      entityId: portalSubmissionId,
      action: AuditAction.RETRY,
      details: {
        previousStatus: submission.status,
      },
    });
    
    // Submit form to portal asynchronously
    // In a production environment, this would be handled by a background job
    setTimeout(() => {
      portalAutomationService.submitFormToPortal(portalSubmissionId, userId)
        .catch(error => {
          console.error('Error retrying portal submission:', error);
        });
    }, 0);
    
    return {
      success: true,
      submission: updatedSubmission,
    };
  } catch (error) {
    console.error('Error retrying portal submission:', error);
    return {
      success: false,
      message: `Failed to retry portal submission: ${error.message}`,
    };
  }
}
