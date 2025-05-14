/**
 * Form Migration Service
 * 
 * Handles migration of form submissions between different template versions.
 */
import db from '@/lib/db';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import * as formTemplateService from './formTemplateService';
import * as formSubmissionRepository from './formSubmissionRepository';
import { FormTemplateVersion, FormSubmission } from '@/types/form';

export interface MigrationRequest {
  templateId: string;
  sourceVersionId: string;
  targetVersionId: string;
  submissionIds: string[];
  userId: string;
}

export interface MigrationResult {
  success: boolean;
  submissionId: string;
  message?: string;
  oldVersion: number;
  newVersion: number;
}

/**
 * Migrate form submissions from one template version to another
 */
export async function migrateSubmissions(
  request: MigrationRequest
): Promise<MigrationResult[]> {
  // Get source and target versions
  const sourceVersion = await formTemplateService.getFormTemplateVersionById(request.sourceVersionId);
  const targetVersion = await formTemplateService.getFormTemplateVersionById(request.targetVersionId);
  
  if (!sourceVersion) {
    throw new Error(`Source version with ID ${request.sourceVersionId} not found`);
  }
  
  if (!targetVersion) {
    throw new Error(`Target version with ID ${request.targetVersionId} not found`);
  }
  
  // Check if versions belong to the same template
  if (sourceVersion.templateId !== request.templateId || targetVersion.templateId !== request.templateId) {
    throw new Error('Source and target versions must belong to the same template');
  }
  
  // Get submissions
  const submissions: FormSubmission[] = [];
  for (const submissionId of request.submissionIds) {
    const submission = await formSubmissionRepository.getFormSubmissionById(submissionId);
    if (submission) {
      submissions.push(submission);
    }
  }
  
  // Check if submissions belong to the template
  for (const submission of submissions) {
    if (submission.templateId !== request.templateId) {
      throw new Error(`Submission ${submission.id} does not belong to template ${request.templateId}`);
    }
  }
  
  // Start transaction
  const client = await db.getClient();
  const results: MigrationResult[] = [];
  
  try {
    await client.query('BEGIN');
    
    // Process each submission
    for (const submission of submissions) {
      try {
        // Map form data from source to target version
        const migratedData = migrateFormData(
          submission.formData,
          sourceVersion,
          targetVersion
        );
        
        // Update submission
        await client.query(
          `UPDATE form_submissions 
           SET form_data = $1, 
               template_version = $2, 
               updated_at = $3
           WHERE id = $4`,
          [
            JSON.stringify(migratedData),
            targetVersion.version,
            new Date(),
            submission.id,
          ]
        );
        
        // Create audit log
        await createAuditLog({
          userId: request.userId,
          entityType: AuditEntityType.FORM_SUBMISSION,
          entityId: submission.id,
          action: AuditAction.UPDATE,
          details: {
            oldVersion: sourceVersion.version,
            newVersion: targetVersion.version,
            operation: 'migration',
          },
        });
        
        results.push({
          success: true,
          submissionId: submission.id,
          oldVersion: sourceVersion.version,
          newVersion: targetVersion.version,
        });
      } catch (error: any) {
        console.error(`Error migrating submission ${submission.id}:`, error);
        results.push({
          success: false,
          submissionId: submission.id,
          message: error.message,
          oldVersion: sourceVersion.version,
          newVersion: targetVersion.version,
        });
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  
  return results;
}

/**
 * Migrate form data from one template version to another
 */
function migrateFormData(
  formData: Record<string, any>,
  sourceVersion: FormTemplateVersion,
  targetVersion: FormTemplateVersion
): Record<string, any> {
  const result: Record<string, any> = {};
  
  // Get field mappings for source and target versions
  const sourceFieldMappings = sourceVersion.fieldMappings || {};
  const targetFieldMappings = targetVersion.fieldMappings || {};
  
  // Create reverse mappings (from field name to form field)
  const sourceReverseMapping: Record<string, string> = {};
  const targetReverseMapping: Record<string, string> = {};
  
  for (const [field, formField] of Object.entries(sourceFieldMappings)) {
    sourceReverseMapping[formField] = field;
  }
  
  for (const [field, formField] of Object.entries(targetFieldMappings)) {
    targetReverseMapping[formField] = field;
  }
  
  // Map fields from source to target
  for (const [formField, value] of Object.entries(formData)) {
    // Get the field name in the source version
    const sourceField = sourceReverseMapping[formField];
    
    if (!sourceField) {
      // This form field doesn't exist in the source mapping, keep it as is
      result[formField] = value;
      continue;
    }
    
    // Get the form field in the target version
    const targetFormField = targetFieldMappings[sourceField];
    
    if (!targetFormField) {
      // This field doesn't exist in the target mapping, skip it
      continue;
    }
    
    // Map the value to the target form field
    result[targetFormField] = value;
  }
  
  // Add default values for required fields that are missing
  for (const field of targetVersion.requiredFields) {
    const targetFormField = targetFieldMappings[field];
    
    if (targetFormField && result[targetFormField] === undefined) {
      // Find the field in the target template
      const targetField = findFieldInTemplate(targetVersion, field);
      
      if (targetField && targetField.defaultValue !== undefined) {
        result[targetFormField] = targetField.defaultValue;
      } else {
        // Use empty string as default
        result[targetFormField] = '';
      }
    }
  }
  
  return result;
}

/**
 * Find a field in a template by name
 */
function findFieldInTemplate(
  version: FormTemplateVersion,
  fieldName: string
): any {
  // Check if template data has sections
  if (!version.templateData || !version.templateData.sections) {
    return null;
  }
  
  // Search for the field in all sections
  for (const section of version.templateData.sections) {
    if (!section.fields) {
      continue;
    }
    
    for (const field of section.fields) {
      if (field.name === fieldName) {
        return field;
      }
    }
  }
  
  return null;
}
