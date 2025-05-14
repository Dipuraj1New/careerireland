-- Migration script for Data Protection module tables

-- Create sensitive_field_definitions table
CREATE TABLE IF NOT EXISTS sensitive_field_definitions (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  encryption_type VARCHAR(20) NOT NULL,
  masking_type VARCHAR(20) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, field_name)
);

-- Create consent_records table
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type VARCHAR(50) NOT NULL,
  consent_version VARCHAR(20) NOT NULL,
  is_granted BOOLEAN NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, consent_type, consent_version, granted_at)
);

-- Create index on consent_records
CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_type ON consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_is_granted ON consent_records(is_granted);

-- Insert default sensitive field definitions for user entity
INSERT INTO sensitive_field_definitions (
  id, entity_type, field_name, encryption_type, masking_type, description, is_active
)
VALUES
  (gen_random_uuid(), 'user', 'email', 'string', 'email', 'User email address', true),
  (gen_random_uuid(), 'user', 'phone', 'string', 'phone', 'User phone number', true),
  (gen_random_uuid(), 'user', 'date_of_birth', 'date', 'date_of_birth', 'User date of birth', true),
  (gen_random_uuid(), 'user', 'national_id', 'string', 'national_id', 'National ID or SSN', true),
  (gen_random_uuid(), 'user', 'passport_number', 'string', 'passport', 'Passport number', true),
  (gen_random_uuid(), 'user', 'address', 'string', 'address', 'User address', true)
ON CONFLICT (entity_type, field_name) DO NOTHING;

-- Insert default sensitive field definitions for payment entity
INSERT INTO sensitive_field_definitions (
  id, entity_type, field_name, encryption_type, masking_type, description, is_active
)
VALUES
  (gen_random_uuid(), 'payment', 'card_number', 'string', 'credit_card', 'Credit card number', true),
  (gen_random_uuid(), 'payment', 'card_holder', 'string', 'name', 'Card holder name', true),
  (gen_random_uuid(), 'payment', 'cvv', 'string', 'custom', 'Card verification value', true),
  (gen_random_uuid(), 'payment', 'billing_address', 'string', 'address', 'Billing address', true)
ON CONFLICT (entity_type, field_name) DO NOTHING;

-- Insert default sensitive field definitions for document entity
INSERT INTO sensitive_field_definitions (
  id, entity_type, field_name, encryption_type, masking_type, description, is_active
)
VALUES
  (gen_random_uuid(), 'document', 'passport_number', 'string', 'passport', 'Passport number in document', true),
  (gen_random_uuid(), 'document', 'national_id', 'string', 'national_id', 'National ID in document', true),
  (gen_random_uuid(), 'document', 'date_of_birth', 'date', 'date_of_birth', 'Date of birth in document', true),
  (gen_random_uuid(), 'document', 'address', 'string', 'address', 'Address in document', true)
ON CONFLICT (entity_type, field_name) DO NOTHING;
