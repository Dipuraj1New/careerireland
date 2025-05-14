-- Create form validation rules table
CREATE TABLE IF NOT EXISTS form_validation_rules (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(20) NOT NULL,
  rule_value TEXT,
  error_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_form_validation_rules_template_id ON form_validation_rules(template_id);
CREATE INDEX IF NOT EXISTS idx_form_validation_rules_field_name ON form_validation_rules(field_name);

-- Add validation rule type constraint
ALTER TABLE form_validation_rules
ADD CONSTRAINT check_rule_type
CHECK (rule_type IN ('required', 'pattern', 'minLength', 'maxLength', 'min', 'max', 'custom'));
