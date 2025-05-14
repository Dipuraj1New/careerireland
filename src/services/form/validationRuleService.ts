/**
 * Service for managing form validation rules
 */
import { v4 as uuidv4 } from 'uuid';
import pool from '../../lib/db';
import { createAuditLog } from '../auditLogService';
import { AuditAction, AuditEntityType } from '../../types/audit';

/**
 * Validation rule types
 */
export type ValidationRuleType = 'required' | 'pattern' | 'minLength' | 'maxLength' | 'min' | 'max' | 'custom';

/**
 * Validation rule
 */
export interface ValidationRule {
  id: string;
  templateId: string;
  fieldName: string;
  ruleType: ValidationRuleType;
  ruleValue: string;
  errorMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Validation rule create data
 */
export interface ValidationRuleCreateData {
  templateId: string;
  fieldName: string;
  ruleType: ValidationRuleType;
  ruleValue: string;
  errorMessage: string;
}

/**
 * Validation rule update data
 */
export interface ValidationRuleUpdateData {
  fieldName?: string;
  ruleType?: ValidationRuleType;
  ruleValue?: string;
  errorMessage?: string;
}

/**
 * Get validation rule by ID
 */
export async function getValidationRuleById(id: string): Promise<ValidationRule | null> {
  const query = `
    SELECT * FROM form_validation_rules
    WHERE id = $1
  `;
  
  const result = await pool.query(query, [id]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  
  return {
    id: row.id,
    templateId: row.template_id,
    fieldName: row.field_name,
    ruleType: row.rule_type as ValidationRuleType,
    ruleValue: row.rule_value,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get validation rules by template ID
 */
export async function getValidationRulesByTemplateId(templateId: string): Promise<ValidationRule[]> {
  const query = `
    SELECT * FROM form_validation_rules
    WHERE template_id = $1
    ORDER BY field_name ASC, rule_type ASC
  `;
  
  const result = await pool.query(query, [templateId]);
  
  return result.rows.map((row) => ({
    id: row.id,
    templateId: row.template_id,
    fieldName: row.field_name,
    ruleType: row.rule_type as ValidationRuleType,
    ruleValue: row.rule_value,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create validation rule
 */
export async function createValidationRule(
  data: ValidationRuleCreateData,
  userId?: string
): Promise<ValidationRule> {
  const id = uuidv4();
  const now = new Date();
  
  const query = `
    INSERT INTO form_validation_rules (
      id, template_id, field_name, rule_type, rule_value, error_message, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const values = [
    id,
    data.templateId,
    data.fieldName,
    data.ruleType,
    data.ruleValue,
    data.errorMessage,
    now,
    now,
  ];
  
  const result = await pool.query(query, values);
  const row = result.rows[0];
  
  // Create audit log if userId is provided
  if (userId) {
    await createAuditLog({
      userId,
      entityType: AuditEntityType.FORM_VALIDATION_RULE,
      entityId: id,
      action: AuditAction.CREATE,
      details: {
        templateId: data.templateId,
        fieldName: data.fieldName,
        ruleType: data.ruleType,
      },
    });
  }
  
  return {
    id: row.id,
    templateId: row.template_id,
    fieldName: row.field_name,
    ruleType: row.rule_type as ValidationRuleType,
    ruleValue: row.rule_value,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Update validation rule
 */
export async function updateValidationRule(
  id: string,
  data: ValidationRuleUpdateData,
  userId?: string
): Promise<ValidationRule | null> {
  // Get existing rule
  const existingRule = await getValidationRuleById(id);
  
  if (!existingRule) {
    return null;
  }
  
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.fieldName !== undefined) {
    updateFields.push(`field_name = $${paramIndex}`);
    values.push(data.fieldName);
    paramIndex++;
  }
  
  if (data.ruleType !== undefined) {
    updateFields.push(`rule_type = $${paramIndex}`);
    values.push(data.ruleType);
    paramIndex++;
  }
  
  if (data.ruleValue !== undefined) {
    updateFields.push(`rule_value = $${paramIndex}`);
    values.push(data.ruleValue);
    paramIndex++;
  }
  
  if (data.errorMessage !== undefined) {
    updateFields.push(`error_message = $${paramIndex}`);
    values.push(data.errorMessage);
    paramIndex++;
  }
  
  if (updateFields.length === 0) {
    return existingRule;
  }
  
  updateFields.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  paramIndex++;
  
  values.push(id);
  
  const query = `
    UPDATE form_validation_rules
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex - 1}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  
  // Create audit log if userId is provided
  if (userId) {
    await createAuditLog({
      userId,
      entityType: AuditEntityType.FORM_VALIDATION_RULE,
      entityId: id,
      action: AuditAction.UPDATE,
      details: {
        templateId: existingRule.templateId,
        fieldName: data.fieldName || existingRule.fieldName,
        ruleType: data.ruleType || existingRule.ruleType,
      },
    });
  }
  
  return {
    id: row.id,
    templateId: row.template_id,
    fieldName: row.field_name,
    ruleType: row.rule_type as ValidationRuleType,
    ruleValue: row.rule_value,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Delete validation rule
 */
export async function deleteValidationRule(
  id: string,
  userId?: string
): Promise<boolean> {
  // Get existing rule
  const existingRule = await getValidationRuleById(id);
  
  if (!existingRule) {
    return false;
  }
  
  const query = `
    DELETE FROM form_validation_rules
    WHERE id = $1
  `;
  
  const result = await pool.query(query, [id]);
  
  // Create audit log if userId is provided
  if (userId) {
    await createAuditLog({
      userId,
      entityType: AuditEntityType.FORM_VALIDATION_RULE,
      entityId: id,
      action: AuditAction.DELETE,
      details: {
        templateId: existingRule.templateId,
        fieldName: existingRule.fieldName,
        ruleType: existingRule.ruleType,
      },
    });
  }
  
  return result.rowCount > 0;
}

/**
 * Validate form data against validation rules
 */
export async function validateFormData(
  templateId: string,
  formData: Record<string, any>
): Promise<{ valid: boolean; errors: Record<string, string> }> {
  // Get validation rules for template
  const rules = await getValidationRulesByTemplateId(templateId);
  
  const errors: Record<string, string> = {};
  
  // Apply validation rules
  for (const rule of rules) {
    const value = formData[rule.fieldName];
    
    switch (rule.ruleType) {
      case 'required':
        if (!value) {
          errors[rule.fieldName] = rule.errorMessage;
        }
        break;
      case 'pattern':
        if (value && !new RegExp(rule.ruleValue).test(value)) {
          errors[rule.fieldName] = rule.errorMessage;
        }
        break;
      case 'minLength':
        if (value && value.length < parseInt(rule.ruleValue)) {
          errors[rule.fieldName] = rule.errorMessage;
        }
        break;
      case 'maxLength':
        if (value && value.length > parseInt(rule.ruleValue)) {
          errors[rule.fieldName] = rule.errorMessage;
        }
        break;
      case 'min':
        if (value && parseFloat(value) < parseFloat(rule.ruleValue)) {
          errors[rule.fieldName] = rule.errorMessage;
        }
        break;
      case 'max':
        if (value && parseFloat(value) > parseFloat(rule.ruleValue)) {
          errors[rule.fieldName] = rule.errorMessage;
        }
        break;
      case 'custom':
        try {
          // eslint-disable-next-line no-new-func
          const validateFn = new Function('value', `return ${rule.ruleValue}`);
          if (!validateFn(value)) {
            errors[rule.fieldName] = rule.errorMessage;
          }
        } catch (error) {
          console.error('Error in custom validation function:', error);
          errors[rule.fieldName] = 'Invalid custom validation rule';
        }
        break;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
