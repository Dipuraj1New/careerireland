-- Create consultation related tables

-- Create consultation status enum
CREATE TYPE consultation_status AS ENUM (
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

-- Create payment status enum
CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded',
  'partially_refunded'
);

-- Create expert_availability table
CREATE TABLE IF NOT EXISTS expert_availability (
  id UUID PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule TEXT, -- iCalendar RRULE format for recurring availability
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT expert_availability_time_check CHECK (start_time < end_time)
);

-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  status consultation_status NOT NULL DEFAULT 'scheduled',
  meeting_url TEXT, -- URL for video conference
  meeting_id VARCHAR(255), -- ID for video conference
  meeting_password VARCHAR(255), -- Password for video conference
  recording_url TEXT, -- URL for recording
  transcript_url TEXT, -- URL for transcript
  notes TEXT, -- Notes from the consultation
  feedback_rating INTEGER, -- Rating from 1-5
  feedback_comment TEXT, -- Feedback comment
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT feedback_rating_check CHECK (feedback_rating IS NULL OR (feedback_rating >= 1 AND feedback_rating <= 5))
);

-- Create consultation_payments table
CREATE TABLE IF NOT EXISTS consultation_payments (
  id UUID PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE RESTRICT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_provider VARCHAR(50),
  transaction_id VARCHAR(255),
  invoice_number VARCHAR(50),
  invoice_url TEXT,
  refund_amount DECIMAL(10, 2),
  refund_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create expert_services table for different consultation services offered by experts
CREATE TABLE IF NOT EXISTS expert_services (
  id UUID PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_expert_availability_expert_id ON expert_availability(expert_id);
CREATE INDEX idx_expert_availability_start_time ON expert_availability(start_time);
CREATE INDEX idx_consultations_expert_id ON consultations(expert_id);
CREATE INDEX idx_consultations_applicant_id ON consultations(applicant_id);
CREATE INDEX idx_consultations_case_id ON consultations(case_id);
CREATE INDEX idx_consultations_scheduled_at ON consultations(scheduled_at);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultation_payments_consultation_id ON consultation_payments(consultation_id);
CREATE INDEX idx_expert_services_expert_id ON expert_services(expert_id);
