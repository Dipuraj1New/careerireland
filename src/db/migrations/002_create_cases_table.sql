-- Create visa_type enum
CREATE TYPE visa_type AS ENUM (
  'student',
  'work',
  'family',
  'business',
  'tourist',
  'other'
);

-- Create case_status enum
CREATE TYPE case_status AS ENUM (
  'draft',
  'submitted',
  'in_review',
  'additional_info_required',
  'approved',
  'rejected',
  'withdrawn',
  'completed'
);

-- Create case_priority enum
CREATE TYPE case_priority AS ENUM (
  'standard',
  'expedited',
  'premium'
);

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  visa_type visa_type NOT NULL,
  status case_status NOT NULL DEFAULT 'draft',
  submission_date TIMESTAMP WITH TIME ZONE,
  decision_date TIMESTAMP WITH TIME ZONE,
  priority case_priority NOT NULL DEFAULT 'standard',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cases_applicant_id ON cases(applicant_id);
CREATE INDEX IF NOT EXISTS idx_cases_agent_id ON cases(agent_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_visa_type ON cases(visa_type);
