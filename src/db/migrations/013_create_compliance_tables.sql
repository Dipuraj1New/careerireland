-- Create compliance-related tables for the Security & Compliance Module

-- Update audit_entity_type enum to include compliance-related entities
ALTER TYPE audit_entity_type ADD VALUE IF NOT EXISTS 'compliance_requirement';
ALTER TYPE audit_entity_type ADD VALUE IF NOT EXISTS 'compliance_report';
ALTER TYPE audit_entity_type ADD VALUE IF NOT EXISTS 'compliance_report_schedule';
ALTER TYPE audit_entity_type ADD VALUE IF NOT EXISTS 'access_review';
ALTER TYPE audit_entity_type ADD VALUE IF NOT EXISTS 'access_review_item';

-- Create compliance_requirements table
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- gdpr, data_protection, retention, consent, access_control, audit, breach_notification, custom
  status VARCHAR(50) NOT NULL DEFAULT 'under_review', -- compliant, non_compliant, partially_compliant, under_review, not_applicable
  details JSONB,
  last_checked TIMESTAMP WITH TIME ZONE,
  next_check_due TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create compliance_reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- compliance_summary, gdpr_compliance, data_protection, consent_management, access_control, audit_log, custom
  format VARCHAR(10) NOT NULL, -- pdf, csv, json, html
  parameters JSONB,
  file_path TEXT,
  file_size INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  generated_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create compliance_report_schedules table
CREATE TABLE IF NOT EXISTS compliance_report_schedules (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- compliance_summary, gdpr_compliance, data_protection, consent_management, access_control, audit_log, custom
  format VARCHAR(10) NOT NULL, -- pdf, csv, json, html
  parameters JSONB,
  frequency VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly
  recipients JSONB NOT NULL, -- Array of email addresses
  next_run_date TIMESTAMP WITH TIME ZONE NOT NULL,
  last_run_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create compliance_check_results table
CREATE TABLE IF NOT EXISTS compliance_check_results (
  id UUID PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- compliant, non_compliant, partially_compliant, under_review, not_applicable
  details JSONB,
  checked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_compliance_requirements_type ON compliance_requirements(type);
CREATE INDEX idx_compliance_requirements_status ON compliance_requirements(status);
CREATE INDEX idx_compliance_requirements_next_check_due ON compliance_requirements(next_check_due);
CREATE INDEX idx_compliance_reports_type ON compliance_reports(type);
CREATE INDEX idx_compliance_reports_generated_at ON compliance_reports(generated_at);
CREATE INDEX idx_compliance_report_schedules_next_run_date ON compliance_report_schedules(next_run_date);
CREATE INDEX idx_compliance_check_results_requirement_id ON compliance_check_results(requirement_id);
CREATE INDEX idx_compliance_check_results_checked_at ON compliance_check_results(checked_at);

-- Add comments
COMMENT ON TABLE compliance_requirements IS 'Stores compliance requirements that need to be monitored';
COMMENT ON TABLE compliance_reports IS 'Stores generated compliance reports';
COMMENT ON TABLE compliance_report_schedules IS 'Stores schedules for recurring compliance reports';
COMMENT ON TABLE compliance_check_results IS 'Stores results of compliance checks';
