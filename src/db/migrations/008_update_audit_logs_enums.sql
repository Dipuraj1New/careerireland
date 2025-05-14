-- Update audit_entity_type enum to include form-related entities
ALTER TYPE audit_entity_type ADD VALUE IF NOT EXISTS 'form_template';
ALTER TYPE audit_entity_type ADD VALUE IF NOT EXISTS 'form_submission';

-- Update audit_action enum to include form-related actions
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'create_version';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'activate';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'deprecate';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'generate';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'sign';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'submit';
