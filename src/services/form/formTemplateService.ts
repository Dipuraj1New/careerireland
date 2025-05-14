/**
 * Form Template Service
 * 
 * Manages form templates and their versions.
 */
import { 
  FormTemplate, 
  FormTemplateStatus, 
  FormTemplateVersion,
  FormTemplateCreateData,
  FormTemplateUpdateData
} from '@/types/form';
import { DocumentType } from '@/types/document';
import * as formTemplateRepository from './formTemplateRepository';
import { createAuditLog } from '@/services/audit/auditService';

/**
 * Create a new form template
 */
export async function createFormTemplate(
  templateData: FormTemplateCreateData,
  userId: string
): Promise<FormTemplate> {
  // Validate template data
  validateTemplateData(templateData);
  
  // Create template
  const template = await formTemplateRepository.createFormTemplate(templateData, userId);
  
  // Create audit log
  await createAuditLog({
    userId,
    entityType: 'form_template',
    entityId: template.id,
    action: 'create',
    details: {
      name: template.name,
      documentTypes: template.documentTypes,
    },
  });
  
  return template;
}

/**
 * Get form template by ID
 */
export async function getFormTemplateById(id: string): Promise<FormTemplate | null> {
  return formTemplateRepository.getFormTemplateById(id);
}

/**
 * Get form templates
 */
export async function getFormTemplates(
  options: {
    status?: FormTemplateStatus;
    documentType?: DocumentType;
    limit?: number;
    offset?: number;
  } = {}
): Promise<FormTemplate[]> {
  return formTemplateRepository.getFormTemplates(options);
}

/**
 * Update form template
 */
export async function updateFormTemplate(
  id: string,
  updateData: FormTemplateUpdateData,
  userId: string,
  createNewVersion: boolean = false
): Promise<FormTemplate | null> {
  // Get current template
  const currentTemplate = await formTemplateRepository.getFormTemplateById(id);
  
  if (!currentTemplate) {
    throw new Error(`Template with ID ${id} not found`);
  }
  
  // Validate update data
  if (updateData.templateData) {
    validateTemplateData({
      ...currentTemplate,
      ...updateData,
    } as FormTemplateCreateData);
  }
  
  // Check if user can update the template
  if (currentTemplate.status === FormTemplateStatus.ACTIVE && 
      updateData.status !== FormTemplateStatus.DEPRECATED) {
    // Only allow updating active templates if creating a new version
    // or if deprecating the template
    if (!createNewVersion) {
      throw new Error('Cannot update an active template without creating a new version');
    }
  }
  
  let updatedTemplate: FormTemplate | null;
  
  // Create new version or update existing
  if (createNewVersion) {
    updatedTemplate = await formTemplateRepository.createFormTemplateVersion(id, updateData, userId);
  } else {
    updatedTemplate = await formTemplateRepository.updateFormTemplate(id, updateData, userId);
  }
  
  if (!updatedTemplate) {
    throw new Error(`Failed to update template with ID ${id}`);
  }
  
  // Create audit log
  await createAuditLog({
    userId,
    entityType: 'form_template',
    entityId: id,
    action: createNewVersion ? 'create_version' : 'update',
    details: {
      name: updatedTemplate.name,
      version: updatedTemplate.version,
      status: updatedTemplate.status,
      documentTypes: updatedTemplate.documentTypes,
    },
  });
  
  return updatedTemplate;
}

/**
 * Activate form template
 */
export async function activateFormTemplate(
  id: string,
  userId: string
): Promise<FormTemplate | null> {
  // Get current template
  const currentTemplate = await formTemplateRepository.getFormTemplateById(id);
  
  if (!currentTemplate) {
    throw new Error(`Template with ID ${id} not found`);
  }
  
  // Check if template is already active
  if (currentTemplate.status === FormTemplateStatus.ACTIVE) {
    return currentTemplate;
  }
  
  // Update template status
  const updatedTemplate = await formTemplateRepository.updateFormTemplate(
    id,
    { status: FormTemplateStatus.ACTIVE },
    userId
  );
  
  if (!updatedTemplate) {
    throw new Error(`Failed to activate template with ID ${id}`);
  }
  
  // Create audit log
  await createAuditLog({
    userId,
    entityType: 'form_template',
    entityId: id,
    action: 'activate',
    details: {
      name: updatedTemplate.name,
      version: updatedTemplate.version,
    },
  });
  
  return updatedTemplate;
}

/**
 * Deprecate form template
 */
export async function deprecateFormTemplate(
  id: string,
  userId: string
): Promise<FormTemplate | null> {
  // Get current template
  const currentTemplate = await formTemplateRepository.getFormTemplateById(id);
  
  if (!currentTemplate) {
    throw new Error(`Template with ID ${id} not found`);
  }
  
  // Check if template is already deprecated
  if (currentTemplate.status === FormTemplateStatus.DEPRECATED) {
    return currentTemplate;
  }
  
  // Update template status
  const updatedTemplate = await formTemplateRepository.updateFormTemplate(
    id,
    { status: FormTemplateStatus.DEPRECATED },
    userId
  );
  
  if (!updatedTemplate) {
    throw new Error(`Failed to deprecate template with ID ${id}`);
  }
  
  // Create audit log
  await createAuditLog({
    userId,
    entityType: 'form_template',
    entityId: id,
    action: 'deprecate',
    details: {
      name: updatedTemplate.name,
      version: updatedTemplate.version,
    },
  });
  
  return updatedTemplate;
}

/**
 * Get form template versions
 */
export async function getFormTemplateVersions(templateId: string): Promise<FormTemplateVersion[]> {
  return formTemplateRepository.getFormTemplateVersions(templateId);
}

/**
 * Get specific form template version
 */
export async function getFormTemplateVersion(
  templateId: string,
  version: number
): Promise<FormTemplateVersion | null> {
  return formTemplateRepository.getFormTemplateVersion(templateId, version);
}

/**
 * Get form templates for document type
 */
export async function getFormTemplatesForDocumentType(
  documentType: DocumentType
): Promise<FormTemplate[]> {
  return formTemplateRepository.getFormTemplates({
    status: FormTemplateStatus.ACTIVE,
    documentType,
  });
}

/**
 * Validate template data
 */
function validateTemplateData(templateData: FormTemplateCreateData): void {
  // Check required fields
  if (!templateData.name) {
    throw new Error('Template name is required');
  }
  
  if (!templateData.documentTypes || templateData.documentTypes.length === 0) {
    throw new Error('At least one document type is required');
  }
  
  if (!templateData.requiredFields) {
    throw new Error('Required fields array is required');
  }
  
  if (!templateData.optionalFields) {
    throw new Error('Optional fields array is required');
  }
  
  if (!templateData.fieldMappings) {
    throw new Error('Field mappings are required');
  }
  
  if (!templateData.templateData) {
    throw new Error('Template data is required');
  }
  
  if (!templateData.templateData.title) {
    throw new Error('Template title is required');
  }
  
  if (!templateData.templateData.sections || templateData.templateData.sections.length === 0) {
    throw new Error('At least one template section is required');
  }
  
  // Validate each section has fields
  for (const [index, section] of templateData.templateData.sections.entries()) {
    if (!section.fields || section.fields.length === 0) {
      throw new Error(`Section ${index + 1} must have at least one field`);
    }
    
    // Validate each field has required properties
    for (const [fieldIndex, field] of section.fields.entries()) {
      if (!field.id) {
        throw new Error(`Field ${fieldIndex + 1} in section ${index + 1} must have an ID`);
      }
      
      if (!field.type) {
        throw new Error(`Field ${fieldIndex + 1} in section ${index + 1} must have a type`);
      }
      
      if (!field.label) {
        throw new Error(`Field ${fieldIndex + 1} in section ${index + 1} must have a label`);
      }
    }
  }
  
  // Validate field mappings include all required fields
  for (const field of templateData.requiredFields) {
    if (!templateData.fieldMappings[field]) {
      throw new Error(`Field mapping for required field '${field}' is missing`);
    }
  }
  
  // Validate field mappings include all optional fields
  for (const field of templateData.optionalFields) {
    if (!templateData.fieldMappings[field]) {
      throw new Error(`Field mapping for optional field '${field}' is missing`);
    }
  }
}
