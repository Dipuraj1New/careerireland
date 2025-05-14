-- Create form_template_status enum
CREATE TYPE form_template_status AS ENUM (
  'draft',
  'active',
  'deprecated'
);

-- Create form_templates table
CREATE TABLE IF NOT EXISTS form_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status form_template_status NOT NULL DEFAULT 'draft',
  document_types TEXT[] NOT NULL, -- Array of document types this template can be used with
  required_fields TEXT[] NOT NULL, -- Array of required field names
  optional_fields TEXT[] NOT NULL, -- Array of optional field names
  field_mappings JSONB NOT NULL, -- Mapping of field names to display labels
  template_data JSONB NOT NULL, -- Template structure and layout data
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_form_templates_status ON form_templates(status);

-- Create form_template_versions table to track version history
CREATE TABLE IF NOT EXISTS form_template_versions (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status form_template_status NOT NULL,
  document_types TEXT[] NOT NULL,
  required_fields TEXT[] NOT NULL,
  optional_fields TEXT[] NOT NULL,
  field_mappings JSONB NOT NULL,
  template_data JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(template_id, version)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_form_template_versions_template_id ON form_template_versions(template_id);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE RESTRICT,
  template_version INTEGER NOT NULL,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL, -- The data used to generate the form
  file_path TEXT NOT NULL, -- Path to the generated PDF
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'generated', -- generated, submitted, approved, rejected
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_form_submissions_case_id ON form_submissions(case_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_template_id ON form_submissions(template_id);

-- Create form_signatures table
CREATE TABLE IF NOT EXISTS form_signatures (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signature_data TEXT NOT NULL, -- Base64 encoded signature image data
  signature_type VARCHAR(50) NOT NULL DEFAULT 'drawn', -- drawn, typed, digital
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_form_signatures_submission_id ON form_signatures(submission_id);

-- Add comments
COMMENT ON TABLE form_templates IS 'Stores form templates for generating PDF forms';
COMMENT ON TABLE form_template_versions IS 'Stores version history of form templates';
COMMENT ON TABLE form_submissions IS 'Stores generated form submissions';
COMMENT ON TABLE form_signatures IS 'Stores signatures for form submissions';
