-- Create security-related tables for the Security & Compliance Module

-- Create security_policies table
CREATE TABLE IF NOT EXISTS security_policies (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  policy_type VARCHAR(50) NOT NULL,
  policy_data JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

-- Create data_retention_policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  retention_period INTEGER NOT NULL, -- in days
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create data_subject_requests table
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  request_type VARCHAR(50) NOT NULL, -- access, erasure, rectification, portability, etc.
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, rejected
  request_data JSONB NOT NULL,
  response_data JSONB,
  notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  handled_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create field_encryption_keys table
CREATE TABLE IF NOT EXISTS field_encryption_keys (
  id UUID PRIMARY KEY,
  key_identifier VARCHAR(100) NOT NULL UNIQUE,
  encrypted_key TEXT NOT NULL, -- Encrypted with master key
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  rotation_date TIMESTAMP WITH TIME ZONE, -- When this key should be rotated
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create security_alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
  source VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  details JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'new', -- new, acknowledged, resolved, false_positive
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create permission_groups table
CREATE TABLE IF NOT EXISTS permission_groups (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL, -- Array of permission strings
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_permission_groups table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_permission_groups (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, group_id)
);

-- Create access_reviews table
CREATE TABLE IF NOT EXISTS access_reviews (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create access_review_items table
CREATE TABLE IF NOT EXISTS access_review_items (
  id UUID PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES access_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  decision VARCHAR(50), -- maintain, revoke, modify
  notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create consent_records table
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(100) NOT NULL,
  consent_version VARCHAR(50) NOT NULL,
  is_granted BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_security_policies_policy_type ON security_policies(policy_type);
CREATE INDEX idx_security_policies_is_active ON security_policies(is_active);
CREATE INDEX idx_data_retention_policies_entity_type ON data_retention_policies(entity_type);
CREATE INDEX idx_data_subject_requests_user_id ON data_subject_requests(user_id);
CREATE INDEX idx_data_subject_requests_status ON data_subject_requests(status);
CREATE INDEX idx_field_encryption_keys_is_active ON field_encryption_keys(is_active);
CREATE INDEX idx_security_alerts_alert_type ON security_alerts(alert_type);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_status ON security_alerts(status);
CREATE INDEX idx_user_permission_groups_user_id ON user_permission_groups(user_id);
CREATE INDEX idx_user_permission_groups_group_id ON user_permission_groups(group_id);
CREATE INDEX idx_access_reviews_status ON access_reviews(status);
CREATE INDEX idx_access_review_items_review_id ON access_review_items(review_id);
CREATE INDEX idx_access_review_items_user_id ON access_review_items(user_id);
CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_records_consent_type ON consent_records(consent_type);

-- Add comments
COMMENT ON TABLE security_policies IS 'Stores security policies for the application';
COMMENT ON TABLE data_retention_policies IS 'Defines how long different types of data should be retained';
COMMENT ON TABLE data_subject_requests IS 'Tracks requests from users regarding their personal data';
COMMENT ON TABLE field_encryption_keys IS 'Manages encryption keys for field-level encryption';
COMMENT ON TABLE security_alerts IS 'Stores security alerts generated by the system';
COMMENT ON TABLE permission_groups IS 'Defines groups of permissions that can be assigned to users';
COMMENT ON TABLE user_permission_groups IS 'Maps users to permission groups';
COMMENT ON TABLE access_reviews IS 'Tracks periodic reviews of user access';
COMMENT ON TABLE access_review_items IS 'Individual items within an access review';
COMMENT ON TABLE consent_records IS 'Records user consent for various purposes';
