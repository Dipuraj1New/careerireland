-- Update audit_action enum to include additional actions
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'view';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'export';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'search';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'filter';

-- Add comment
COMMENT ON TYPE audit_action IS 'Enum for audit log action types';
