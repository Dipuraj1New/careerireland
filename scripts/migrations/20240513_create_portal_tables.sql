-- Create portal field mappings table
CREATE TABLE IF NOT EXISTS portal_field_mappings (
  id UUID PRIMARY KEY,
  portal_type VARCHAR(50) NOT NULL,
  form_field VARCHAR(100) NOT NULL,
  portal_field VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(portal_type, form_field)
);

-- Create portal submissions table
CREATE TABLE IF NOT EXISTS portal_submissions (
  id UUID PRIMARY KEY,
  form_submission_id UUID NOT NULL REFERENCES form_submissions(id),
  portal_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  confirmation_number VARCHAR(100),
  confirmation_receipt_url TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portal_submissions_form_submission_id ON portal_submissions(form_submission_id);
CREATE INDEX IF NOT EXISTS idx_portal_submissions_status ON portal_submissions(status);
CREATE INDEX IF NOT EXISTS idx_portal_field_mappings_portal_type ON portal_field_mappings(portal_type);
