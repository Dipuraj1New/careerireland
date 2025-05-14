-- Create audit_entity_type enum
CREATE TYPE audit_entity_type AS ENUM (
  'user',
  'case',
  'document'
);

-- Create audit_action enum
CREATE TYPE audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'update_status',
  'assign_agent',
  'update_priority',
  'upload',
  'download',
  'login',
  'logout'
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type audit_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  action audit_action NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_entity_id ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
