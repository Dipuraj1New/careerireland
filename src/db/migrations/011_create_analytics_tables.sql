-- Create analytics related tables

-- Create report type enum
CREATE TYPE report_type AS ENUM (
  'system',
  'custom'
);

-- Create report format enum
CREATE TYPE report_format AS ENUM (
  'csv',
  'pdf',
  'excel',
  'json'
);

-- Create report schedule frequency enum
CREATE TYPE report_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'quarterly'
);

-- Create analytics_metrics table to store metric definitions
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  calculation_query TEXT NOT NULL, -- SQL query to calculate the metric
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create analytics_metric_values table to store calculated metric values
CREATE TABLE IF NOT EXISTS analytics_metric_values (
  id UUID PRIMARY KEY,
  metric_id UUID NOT NULL REFERENCES analytics_metrics(id) ON DELETE CASCADE,
  date_key DATE NOT NULL, -- Date for which the metric is calculated
  value DECIMAL(20, 5) NOT NULL, -- Numeric value of the metric
  dimension_values JSONB, -- Additional dimension values for slicing
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_metric_date_dimension UNIQUE (metric_id, date_key, dimension_values)
);

-- Create analytics_dashboards table
CREATE TABLE IF NOT EXISTS analytics_dashboards (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  layout JSONB NOT NULL, -- Dashboard layout configuration
  is_system BOOLEAN NOT NULL DEFAULT FALSE, -- Whether this is a system dashboard
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create analytics_dashboard_widgets table
CREATE TABLE IF NOT EXISTS analytics_dashboard_widgets (
  id UUID PRIMARY KEY,
  dashboard_id UUID NOT NULL REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  widget_type VARCHAR(50) NOT NULL, -- Type of widget (chart, table, etc.)
  configuration JSONB NOT NULL, -- Widget configuration
  position JSONB NOT NULL, -- Position in the dashboard
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create analytics_reports table
CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type report_type NOT NULL DEFAULT 'custom',
  query TEXT, -- SQL query for custom reports
  parameters JSONB, -- Report parameters
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create analytics_report_schedules table
CREATE TABLE IF NOT EXISTS analytics_report_schedules (
  id UUID PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES analytics_reports(id) ON DELETE CASCADE,
  frequency report_frequency NOT NULL,
  day_of_week INTEGER, -- 0-6 for weekly reports (0 = Sunday)
  day_of_month INTEGER, -- 1-31 for monthly reports
  time_of_day TIME NOT NULL, -- Time to run the report
  format report_format NOT NULL DEFAULT 'pdf',
  recipients TEXT[] NOT NULL, -- Array of email addresses
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create analytics_report_executions table
CREATE TABLE IF NOT EXISTS analytics_report_executions (
  id UUID PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES analytics_reports(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES analytics_report_schedules(id) ON DELETE SET NULL,
  parameters JSONB, -- Parameters used for this execution
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  result_file_path TEXT, -- Path to the generated report file
  error_message TEXT, -- Error message if failed
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_analytics_metric_values_metric_id ON analytics_metric_values(metric_id);
CREATE INDEX idx_analytics_metric_values_date_key ON analytics_metric_values(date_key);
CREATE INDEX idx_analytics_dashboard_widgets_dashboard_id ON analytics_dashboard_widgets(dashboard_id);
CREATE INDEX idx_analytics_report_schedules_report_id ON analytics_report_schedules(report_id);
CREATE INDEX idx_analytics_report_schedules_next_run_at ON analytics_report_schedules(next_run_at);
CREATE INDEX idx_analytics_report_executions_report_id ON analytics_report_executions(report_id);
CREATE INDEX idx_analytics_report_executions_status ON analytics_report_executions(status);
