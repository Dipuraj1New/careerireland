-- Create compliance_check_schedules table
CREATE TABLE IF NOT EXISTS compliance_check_schedules (
  id UUID PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
  frequency VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly
  next_run_date TIMESTAMP WITH TIME ZONE NOT NULL,
  last_run_date TIMESTAMP WITH TIME ZONE,
  notify_email VARCHAR(255) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create index on requirement_id
CREATE INDEX IF NOT EXISTS compliance_check_schedules_requirement_id_idx ON compliance_check_schedules(requirement_id);

-- Create index on next_run_date for efficient scheduling
CREATE INDEX IF NOT EXISTS compliance_check_schedules_next_run_date_idx ON compliance_check_schedules(next_run_date);

-- Create index on is_active for filtering active schedules
CREATE INDEX IF NOT EXISTS compliance_check_schedules_is_active_idx ON compliance_check_schedules(is_active);

-- Add comments
COMMENT ON TABLE compliance_check_schedules IS 'Stores schedules for recurring compliance checks';
COMMENT ON COLUMN compliance_check_schedules.requirement_id IS 'Reference to the compliance requirement to check';
COMMENT ON COLUMN compliance_check_schedules.frequency IS 'How often to run the check (daily, weekly, monthly, quarterly)';
COMMENT ON COLUMN compliance_check_schedules.next_run_date IS 'When the next check is scheduled to run';
COMMENT ON COLUMN compliance_check_schedules.last_run_date IS 'When the last check was run';
COMMENT ON COLUMN compliance_check_schedules.notify_email IS 'Email to notify when check is complete';
COMMENT ON COLUMN compliance_check_schedules.created_by IS 'User who created the schedule';
COMMENT ON COLUMN compliance_check_schedules.is_active IS 'Whether the schedule is active';

-- Create compliance_check_results table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS compliance_check_results (
  id UUID PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- compliant, non_compliant, partially_compliant, under_review, not_applicable
  details JSONB,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  checked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES compliance_check_schedules(id) ON DELETE SET NULL
);

-- Create index on requirement_id
CREATE INDEX IF NOT EXISTS compliance_check_results_requirement_id_idx ON compliance_check_results(requirement_id);

-- Create index on checked_at for trend analysis
CREATE INDEX IF NOT EXISTS compliance_check_results_checked_at_idx ON compliance_check_results(checked_at);

-- Add comments
COMMENT ON TABLE compliance_check_results IS 'Stores results of compliance checks';
COMMENT ON COLUMN compliance_check_results.requirement_id IS 'Reference to the compliance requirement that was checked';
COMMENT ON COLUMN compliance_check_results.status IS 'Result of the compliance check';
COMMENT ON COLUMN compliance_check_results.details IS 'Detailed information about the check result';
COMMENT ON COLUMN compliance_check_results.checked_at IS 'When the check was performed';
COMMENT ON COLUMN compliance_check_results.checked_by IS 'User who performed the check';
COMMENT ON COLUMN compliance_check_results.schedule_id IS 'Reference to the schedule that triggered this check, if any';
