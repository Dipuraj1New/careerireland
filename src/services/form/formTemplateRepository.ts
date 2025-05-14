/**
 * Form Template Repository
 * 
 * Handles database operations for form templates.
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { 
  FormTemplate, 
  FormTemplateStatus, 
  FormTemplateVersion,
  FormTemplateCreateData,
  FormTemplateUpdateData
} from '@/types/form';
import { DocumentType } from '@/types/document';

/**
 * Create a new form template
 */
export async function createFormTemplate(
  templateData: FormTemplateCreateData,
  userId: string
): Promise<FormTemplate> {
  const templateId = uuidv4();
  const now = new Date();
  
  const result = await db.query(
    `INSERT INTO form_templates (
      id, name, description, version, status, document_types, 
      required_fields, optional_fields, field_mappings, template_data,
      created_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      templateId,
      templateData.name,
      templateData.description || null,
      1, // Initial version
      FormTemplateStatus.DRAFT,
      templateData.documentTypes,
      templateData.requiredFields,
      templateData.optionalFields,
      JSON.stringify(templateData.fieldMappings),
      JSON.stringify(templateData.templateData),
      userId,
      now,
      now,
    ]
  );
  
  // Create initial version record
  await db.query(
    `INSERT INTO form_template_versions (
      id, template_id, version, name, description, status, document_types,
      required_fields, optional_fields, field_mappings, template_data,
      created_by, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      uuidv4(),
      templateId,
      1, // Initial version
      templateData.name,
      templateData.description || null,
      FormTemplateStatus.DRAFT,
      templateData.documentTypes,
      templateData.requiredFields,
      templateData.optionalFields,
      JSON.stringify(templateData.fieldMappings),
      JSON.stringify(templateData.templateData),
      userId,
      now,
    ]
  );
  
  return mapFormTemplateFromDb(result.rows[0]);
}

/**
 * Get form template by ID
 */
export async function getFormTemplateById(id: string): Promise<FormTemplate | null> {
  const result = await db.query(
    `SELECT * FROM form_templates 
     WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapFormTemplateFromDb(result.rows[0]);
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
  let query = `SELECT * FROM form_templates WHERE 1=1`;
  const params: any[] = [];
  
  // Add filters
  if (options.status) {
    params.push(options.status);
    query += ` AND status = $${params.length}`;
  }
  
  if (options.documentType) {
    params.push(options.documentType);
    query += ` AND $${params.length} = ANY(document_types)`;
  }
  
  // Add sorting
  query += ` ORDER BY created_at DESC`;
  
  // Add pagination
  if (options.limit) {
    params.push(options.limit);
    query += ` LIMIT $${params.length}`;
  }
  
  if (options.offset) {
    params.push(options.offset);
    query += ` OFFSET $${params.length}`;
  }
  
  const result = await db.query(query, params);
  
  return result.rows.map(mapFormTemplateFromDb);
}

/**
 * Update form template
 */
export async function updateFormTemplate(
  id: string,
  updateData: FormTemplateUpdateData,
  userId: string
): Promise<FormTemplate | null> {
  // Get current template
  const currentTemplate = await getFormTemplateById(id);
  
  if (!currentTemplate) {
    return null;
  }
  
  // Start building the query
  const updates: string[] = [];
  const params: any[] = [id];
  
  // Add fields to update
  if (updateData.name !== undefined) {
    params.push(updateData.name);
    updates.push(`name = $${params.length}`);
  }
  
  if (updateData.description !== undefined) {
    params.push(updateData.description);
    updates.push(`description = $${params.length}`);
  }
  
  if (updateData.status !== undefined) {
    params.push(updateData.status);
    updates.push(`status = $${params.length}`);
    
    // If activating, set published_at
    if (updateData.status === FormTemplateStatus.ACTIVE && currentTemplate.status !== FormTemplateStatus.ACTIVE) {
      const now = new Date();
      params.push(now);
      updates.push(`published_at = $${params.length}`);
    }
  }
  
  if (updateData.documentTypes !== undefined) {
    params.push(updateData.documentTypes);
    updates.push(`document_types = $${params.length}`);
  }
  
  if (updateData.requiredFields !== undefined) {
    params.push(updateData.requiredFields);
    updates.push(`required_fields = $${params.length}`);
  }
  
  if (updateData.optionalFields !== undefined) {
    params.push(updateData.optionalFields);
    updates.push(`optional_fields = $${params.length}`);
  }
  
  if (updateData.fieldMappings !== undefined) {
    params.push(JSON.stringify(updateData.fieldMappings));
    updates.push(`field_mappings = $${params.length}`);
  }
  
  if (updateData.templateData !== undefined) {
    params.push(JSON.stringify(updateData.templateData));
    updates.push(`template_data = $${params.length}`);
  }
  
  // Add updated_at
  const now = new Date();
  params.push(now);
  updates.push(`updated_at = $${params.length}`);
  
  // If no updates, return current template
  if (updates.length === 0) {
    return currentTemplate;
  }
  
  // Execute update
  const result = await db.query(
    `UPDATE form_templates 
     SET ${updates.join(', ')} 
     WHERE id = $1 
     RETURNING *`,
    params
  );
  
  return mapFormTemplateFromDb(result.rows[0]);
}

/**
 * Create a new version of a form template
 */
export async function createFormTemplateVersion(
  templateId: string,
  updateData: FormTemplateUpdateData,
  userId: string
): Promise<FormTemplate | null> {
  // Get current template
  const currentTemplate = await getFormTemplateById(templateId);
  
  if (!currentTemplate) {
    return null;
  }
  
  // Start transaction
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    // Increment version
    const newVersion = currentTemplate.version + 1;
    
    // Create new version record
    await client.query(
      `INSERT INTO form_template_versions (
        id, template_id, version, name, description, status, document_types,
        required_fields, optional_fields, field_mappings, template_data,
        created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        uuidv4(),
        templateId,
        newVersion,
        updateData.name || currentTemplate.name,
        updateData.description !== undefined ? updateData.description : currentTemplate.description,
        updateData.status || currentTemplate.status,
        updateData.documentTypes || currentTemplate.documentTypes,
        updateData.requiredFields || currentTemplate.requiredFields,
        updateData.optionalFields || currentTemplate.optionalFields,
        JSON.stringify(updateData.fieldMappings || currentTemplate.fieldMappings),
        JSON.stringify(updateData.templateData || currentTemplate.templateData),
        userId,
        new Date(),
      ]
    );
    
    // Update the template with new version and data
    const updateResult = await client.query(
      `UPDATE form_templates 
       SET version = $1, 
           name = $2, 
           description = $3, 
           status = $4, 
           document_types = $5,
           required_fields = $6, 
           optional_fields = $7, 
           field_mappings = $8, 
           template_data = $9,
           updated_at = $10,
           published_at = CASE WHEN $4 = 'active' AND status != 'active' THEN $10 ELSE published_at END
       WHERE id = $11
       RETURNING *`,
      [
        newVersion,
        updateData.name || currentTemplate.name,
        updateData.description !== undefined ? updateData.description : currentTemplate.description,
        updateData.status || currentTemplate.status,
        updateData.documentTypes || currentTemplate.documentTypes,
        updateData.requiredFields || currentTemplate.requiredFields,
        updateData.optionalFields || currentTemplate.optionalFields,
        JSON.stringify(updateData.fieldMappings || currentTemplate.fieldMappings),
        JSON.stringify(updateData.templateData || currentTemplate.templateData),
        new Date(),
        templateId,
      ]
    );
    
    await client.query('COMMIT');
    
    return mapFormTemplateFromDb(updateResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating form template version:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get form template versions
 */
export async function getFormTemplateVersions(templateId: string): Promise<FormTemplateVersion[]> {
  const result = await db.query(
    `SELECT * FROM form_template_versions 
     WHERE template_id = $1 
     ORDER BY version DESC`,
    [templateId]
  );
  
  return result.rows.map(mapFormTemplateVersionFromDb);
}

/**
 * Get specific form template version
 */
export async function getFormTemplateVersion(
  templateId: string,
  version: number
): Promise<FormTemplateVersion | null> {
  const result = await db.query(
    `SELECT * FROM form_template_versions 
     WHERE template_id = $1 AND version = $2`,
    [templateId, version]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapFormTemplateVersionFromDb(result.rows[0]);
}

/**
 * Map database row to FormTemplate
 */
function mapFormTemplateFromDb(row: any): FormTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    status: row.status as FormTemplateStatus,
    documentTypes: row.document_types as DocumentType[],
    requiredFields: row.required_fields,
    optionalFields: row.optional_fields,
    fieldMappings: row.field_mappings,
    templateData: row.template_data,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

/**
 * Map database row to FormTemplateVersion
 */
function mapFormTemplateVersionFromDb(row: any): FormTemplateVersion {
  return {
    id: row.id,
    templateId: row.template_id,
    version: row.version,
    name: row.name,
    description: row.description,
    status: row.status as FormTemplateStatus,
    documentTypes: row.document_types as DocumentType[],
    requiredFields: row.required_fields,
    optionalFields: row.optional_fields,
    fieldMappings: row.field_mappings,
    templateData: row.template_data,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
