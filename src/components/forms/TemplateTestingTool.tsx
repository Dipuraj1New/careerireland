'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '../../types/user';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'email' | 'tel' | 'url' | 'password' | 'file' | 'radio';
  required: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
  helpText?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    customRule?: string;
  };
  conditional?: {
    dependsOn?: string;
    showWhen?: string;
  };
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

interface ValidationRule {
  id: string;
  templateId: string;
  fieldName: string;
  ruleType: 'required' | 'pattern' | 'minLength' | 'maxLength' | 'min' | 'max' | 'custom' | 'crossField' | 'conditional';
  ruleValue: string;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
  relatedFields?: string[];
}

interface ValidationError {
  fieldName: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  sections?: FormSection[];
  fields?: FormField[]; // For backward compatibility
  version: string;
  status?: 'draft' | 'active' | 'archived';
}

interface TemplateTestingToolProps {
  templateId: string;
}

export default function TemplateTestingTool({ templateId }: TemplateTestingToolProps) {
  const { data: session } = useSession();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    message: string;
    details?: string;
    errors?: ValidationError[];
  } | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showConditionalFields, setShowConditionalFields] = useState<Record<string, boolean>>({});

  // Check if user is authorized (admin only)
  useEffect(() => {
    if (session && session.user && session.user.role !== UserRole.ADMIN) {
      // Redirect or show error
      setError('Only administrators can access this page');
    }
  }, [session]);

  // Load form template and validation rules
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load form template
        const templateResponse = await fetch(`/api/forms/templates/${templateId}`);
        if (!templateResponse.ok) {
          throw new Error('Failed to load form template');
        }
        const templateData = await templateResponse.json();
        setTemplate(templateData.template);

        // Initialize form data with default values
        const initialData: Record<string, any> = {};
        const conditionalFieldsState: Record<string, boolean> = {};

        // Check if template has sections
        if (templateData.template.sections) {
          // Set the first section as active
          if (templateData.template.sections.length > 0) {
            setActiveSection(templateData.template.sections[0].id);
          }

          // Initialize form data from sections
          templateData.template.sections.forEach((section: FormSection) => {
            section.fields.forEach((field: FormField) => {
              initialData[field.name] = field.defaultValue || '';

              // Initialize conditional fields visibility
              if (field.conditional?.dependsOn) {
                const dependentField = field.conditional.dependsOn;
                const showWhen = field.conditional.showWhen;
                const dependentValue = initialData[dependentField];

                conditionalFieldsState[field.name] = dependentValue === showWhen;
              }
            });
          });
        } else if (templateData.template.fields) {
          // For backward compatibility with templates that don't have sections
          templateData.template.fields.forEach((field: FormField) => {
            initialData[field.name] = field.defaultValue || '';

            // Initialize conditional fields visibility
            if (field.conditional?.dependsOn) {
              const dependentField = field.conditional.dependsOn;
              const showWhen = field.conditional.showWhen;
              const dependentValue = initialData[dependentField];

              conditionalFieldsState[field.name] = dependentValue === showWhen;
            }
          });
        }

        setFormData(initialData);
        setShowConditionalFields(conditionalFieldsState);

        // Load validation rules
        const rulesResponse = await fetch(`/api/forms/templates/${templateId}/validation-rules`);
        if (!rulesResponse.ok) {
          throw new Error('Failed to load validation rules');
        }
        const rulesData = await rulesResponse.json();
        setValidationRules(rulesData.validationRules);
      } catch (error: any) {
        setError(error.message || 'An error occurred while loading data');
      } finally {
        setLoading(false);
      }
    };

    if (templateId && session?.user) {
      loadData();
    }
  }, [templateId, session]);

  // Handle form field changes
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const newValue = type === 'checkbox' ? checked : value;

    const newFormData = {
      ...formData,
      [name]: newValue,
    };

    setFormData(newFormData);

    // Update conditional fields visibility
    const newConditionalFieldsState = { ...showConditionalFields };
    let hasChanges = false;

    // Get all fields from the template
    const allFields = template?.sections
      ? template.sections.flatMap(section => section.fields)
      : template?.fields || [];

    // Check if any conditional fields depend on this field
    allFields.forEach(field => {
      if (field.conditional?.dependsOn === name) {
        const shouldShow = newValue === field.conditional.showWhen;
        if (newConditionalFieldsState[field.name] !== shouldShow) {
          newConditionalFieldsState[field.name] = shouldShow;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setShowConditionalFields(newConditionalFieldsState);
    }

    // Clear errors for this field
    setValidationErrors(validationErrors.filter(error => error.fieldName !== name));

    // Validate form after field change
    validateForm(newFormData);
  };

  // Validate form data
  const validateForm = (values: Record<string, any> = formData) => {
    const errors: ValidationError[] = [];

    // Get all fields from the template
    const allFields = template?.sections
      ? template.sections.flatMap(section => section.fields)
      : template?.fields || [];

    // Check required fields
    allFields.forEach((field) => {
      // Skip validation for conditional fields that are not shown
      if (field.conditional?.dependsOn) {
        const dependentValue = values[field.conditional.dependsOn];
        if (dependentValue !== field.conditional.showWhen) {
          return;
        }
      }

      const value = values[field.name];

      // Required validation
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          fieldName: field.name,
          message: `${field.label} is required`,
          severity: 'error'
        });
      }

      // Skip other validations if value is empty and not required
      if (value === undefined || value === null || value === '') {
        return;
      }

      // Field-specific validations from field definition
      if (field.validation) {
        // Pattern validation
        if (field.validation.pattern && typeof value === 'string') {
          try {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(value)) {
              errors.push({
                fieldName: field.name,
                message: `${field.label} does not match the required pattern`,
                severity: 'error'
              });
            }
          } catch (e) {
            console.error(`Invalid regex pattern for ${field.name}:`, e);
          }
        }

        // Min length validation
        if (field.validation.minLength !== undefined && typeof value === 'string' && value.length < field.validation.minLength) {
          errors.push({
            fieldName: field.name,
            message: `${field.label} must be at least ${field.validation.minLength} characters`,
            severity: 'error'
          });
        }

        // Max length validation
        if (field.validation.maxLength !== undefined && typeof value === 'string' && value.length > field.validation.maxLength) {
          errors.push({
            fieldName: field.name,
            message: `${field.label} must be at most ${field.validation.maxLength} characters`,
            severity: 'error'
          });
        }

        // Min value validation
        if (field.validation.min !== undefined && typeof value === 'number' && value < field.validation.min) {
          errors.push({
            fieldName: field.name,
            message: `${field.label} must be at least ${field.validation.min}`,
            severity: 'error'
          });
        }

        // Max value validation
        if (field.validation.max !== undefined && typeof value === 'number' && value > field.validation.max) {
          errors.push({
            fieldName: field.name,
            message: `${field.label} must be at most ${field.validation.max}`,
            severity: 'error'
          });
        }

        // Custom rule validation
        if (field.validation.customRule) {
          try {
            const customValidationFn = new Function('value', `return (${field.validation.customRule})`);
            if (!customValidationFn(value)) {
              errors.push({
                fieldName: field.name,
                message: `${field.label} failed custom validation`,
                severity: 'error'
              });
            }
          } catch (e) {
            console.error(`Error in custom validation for ${field.name}:`, e);
          }
        }
      }
    });

    // Apply validation rules
    validationRules.forEach((rule) => {
      const field = allFields.find(f => f.name === rule.fieldName);

      if (!field) return;

      // Skip validation for conditional fields that are not shown
      if (field.conditional?.dependsOn) {
        const dependentValue = values[field.conditional.dependsOn];
        if (dependentValue !== field.conditional.showWhen) {
          return;
        }
      }

      const value = values[rule.fieldName];

      // Skip validation if value is empty and not required
      if ((value === undefined || value === null || value === '') && !field.required) {
        return;
      }

      try {
        let isValid = true;

        switch (rule.ruleType) {
          case 'required':
            isValid = value !== undefined && value !== null && value !== '';
            break;
          case 'pattern':
            isValid = new RegExp(rule.ruleValue).test(String(value));
            break;
          case 'minLength':
            isValid = String(value).length >= parseInt(rule.ruleValue);
            break;
          case 'maxLength':
            isValid = String(value).length <= parseInt(rule.ruleValue);
            break;
          case 'min':
            isValid = parseFloat(value) >= parseFloat(rule.ruleValue);
            break;
          case 'max':
            isValid = parseFloat(value) <= parseFloat(rule.ruleValue);
            break;
          case 'custom':
            // Evaluate custom validation function
            const customValidationFn = new Function('value', `return (${rule.ruleValue})`);
            isValid = customValidationFn(value);
            break;
          case 'crossField':
            // Evaluate cross-field validation function
            if (rule.relatedFields && rule.relatedFields.length > 0) {
              const crossFieldValidationFn = new Function('value', 'formValues', `return (${rule.ruleValue})`);
              isValid = crossFieldValidationFn(value, values);
            }
            break;
          case 'conditional':
            // Evaluate conditional validation function
            if (rule.relatedFields && rule.relatedFields.length > 0) {
              const conditionalValidationFn = new Function('value', 'formValues', `return (${rule.ruleValue})`);
              const shouldValidate = conditionalValidationFn(value, values);

              // Skip validation if condition is not met
              if (!shouldValidate) {
                isValid = true;
              }
            }
            break;
        }

        if (!isValid) {
          errors.push({
            fieldName: rule.fieldName,
            message: rule.errorMessage,
            severity: rule.severity || 'error'
          });
        }
      } catch (error) {
        console.error(`Error evaluating validation rule for ${rule.fieldName}:`, error);
        errors.push({
          fieldName: rule.fieldName,
          message: `Validation error: ${error}`,
          severity: 'error'
        });
      }
    });

    setValidationErrors(errors);
    return errors;
  };

  // Test form submission
  const testFormSubmission = () => {
    setTestResult(null);

    const errors = validateForm();
    const hasErrors = errors.some(error => error.severity === 'error');
    const hasWarnings = errors.some(error => error.severity === 'warning');

    if (!hasErrors && !hasWarnings) {
      setTestResult({
        valid: true,
        message: 'Form validation passed successfully!',
        details: `All fields in the form are valid. The form data would be submitted as:\n\n${JSON.stringify(formData, null, 2)}`,
      });
    } else if (!hasErrors && hasWarnings) {
      setTestResult({
        valid: true,
        message: 'Form validation passed with warnings.',
        details: `The form has warnings but can still be submitted. The form data would be submitted as:\n\n${JSON.stringify(formData, null, 2)}`,
        errors: errors.filter(error => error.severity === 'warning'),
      });
    } else {
      setTestResult({
        valid: false,
        message: 'Form validation failed.',
        details: `Please fix the following errors:`,
        errors: errors.filter(error => error.severity === 'error'),
      });
    }
  };

  // Reset form
  const resetForm = () => {
    // Reset to default values
    const initialData: Record<string, any> = {};
    const conditionalFieldsState: Record<string, boolean> = {};

    // Get all fields from the template
    const allFields = template?.sections
      ? template.sections.flatMap(section => section.fields)
      : template?.fields || [];

    // Initialize form data with default values
    allFields.forEach((field) => {
      initialData[field.name] = field.defaultValue || '';

      // Initialize conditional fields visibility
      if (field.conditional?.dependsOn) {
        const dependentField = field.conditional.dependsOn;
        const showWhen = field.conditional.showWhen;
        const dependentValue = initialData[dependentField];

        conditionalFieldsState[field.name] = dependentValue === showWhen;
      }
    });

    setFormData(initialData);
    setShowConditionalFields(conditionalFieldsState);
    setValidationErrors([]);
    setTestResult(null);
  };

  // Handle section change
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  // If not authorized, show error
  if (session && session.user && session.user.role !== UserRole.ADMIN) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium">Access Denied</h3>
          <p>Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  // If loading, show loading state
  if (loading || !template) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  // Helper function to get field errors
  const getFieldErrors = (fieldName: string) => {
    return validationErrors.filter(error => error.fieldName === fieldName);
  };

  // Helper function to get error class based on severity
  const getErrorClass = (fieldName: string) => {
    const errors = getFieldErrors(fieldName);
    if (errors.length === 0) return 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500';

    if (errors.some(error => error.severity === 'error')) {
      return 'border-red-300 focus:border-red-500 focus:ring-red-500';
    } else if (errors.some(error => error.severity === 'warning')) {
      return 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500';
    } else {
      return 'border-blue-300 focus:border-blue-500 focus:ring-blue-500';
    }
  };

  // Helper function to render field errors
  const renderFieldErrors = (fieldName: string) => {
    const errors = getFieldErrors(fieldName);
    if (errors.length === 0) return null;

    return (
      <div className="mt-1">
        {errors.map((error, index) => {
          let textColor = 'text-red-600';
          if (error.severity === 'warning') textColor = 'text-yellow-600';
          if (error.severity === 'info') textColor = 'text-blue-600';

          return (
            <p key={index} className={`text-sm ${textColor}`}>
              {error.message}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper function to render a form field
  const renderField = (field: FormField) => {
    // Skip if this is a conditional field that should not be shown
    if (field.conditional?.dependsOn && !showConditionalFields[field.name]) {
      return null;
    }

    return (
      <div key={field.id} className="mb-4">
        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>

        {field.type === 'text' && (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleFieldChange}
            placeholder={field.placeholder}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${getErrorClass(field.name)}`}
          />
        )}

        {field.type === 'email' && (
          <input
            type="email"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleFieldChange}
            placeholder={field.placeholder}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${getErrorClass(field.name)}`}
          />
        )}

        {field.type === 'password' && (
          <input
            type="password"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleFieldChange}
            placeholder={field.placeholder}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${getErrorClass(field.name)}`}
          />
        )}

        {field.type === 'tel' && (
          <input
            type="tel"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleFieldChange}
            placeholder={field.placeholder}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${getErrorClass(field.name)}`}
          />
        )}

        {field.type === 'url' && (
          <input
            type="url"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleFieldChange}
            placeholder={field.placeholder}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${getErrorClass(field.name)}`}
          />
        )}

        {field.type === 'number' && (
          <input
            type="number"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleFieldChange}
            placeholder={field.placeholder}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${getErrorClass(field.name)}`}
          />
        )}

        {field.type === 'date' && (
          <input
            type="date"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleFieldChange}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${getErrorClass(field.name)}`}
          />
        )}

        {field.type === 'select' && (
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleFieldChange}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${getErrorClass(field.name)}`}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}

        {field.type === 'checkbox' && (
          <div className="mt-1 flex items-center">
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={formData[field.name] || false}
              onChange={handleFieldChange}
              className={`h-4 w-4 rounded ${getErrorClass(field.name)}`}
            />
            <label htmlFor={field.name} className="ml-2 text-sm text-gray-700">
              {field.placeholder || 'Yes'}
            </label>
          </div>
        )}

        {field.type === 'radio' && field.options && (
          <div className="mt-1 space-y-2">
            {field.options.map((option) => (
              <div key={option} className="flex items-center">
                <input
                  type="radio"
                  id={`${field.name}-${option}`}
                  name={field.name}
                  value={option}
                  checked={formData[field.name] === option}
                  onChange={handleFieldChange}
                  className={`h-4 w-4 ${getErrorClass(field.name)}`}
                />
                <label htmlFor={`${field.name}-${option}`} className="ml-2 text-sm text-gray-700">
                  {option}
                </label>
              </div>
            ))}
          </div>
        )}

        {field.type === 'textarea' && (
          <textarea
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleFieldChange}
            placeholder={field.placeholder}
            rows={3}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${getErrorClass(field.name)}`}
          />
        )}

        {field.helpText && (
          <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
        )}

        {renderFieldErrors(field.name)}
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Template Testing Tool</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-2">Template Information</h3>
          <p className="text-sm text-gray-500">
            <span className="font-medium">Name:</span> {template.name}
          </p>
          <p className="text-sm text-gray-500">
            <span className="font-medium">Version:</span> {template.version}
          </p>
          {template.status && (
            <p className="text-sm text-gray-500">
              <span className="font-medium">Status:</span> {template.status}
            </p>
          )}
          <p className="text-sm text-gray-500">
            <span className="font-medium">Description:</span> {template.description || 'No description provided'}
          </p>
        </div>

        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Test Form</h3>
          <p className="text-sm text-gray-500 mb-4">
            Fill out the form below to test the template and validation rules.
          </p>

          {/* Section Tabs (if template has sections) */}
          {template.sections && template.sections.length > 0 && (
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {template.sections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleSectionChange(section.id)}
                      className={`${
                        activeSection === section.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {template.sections && template.sections.length > 0 ? (
              // Render fields from active section
              <div>
                {activeSection && (
                  <div>
                    {template.sections.find(section => section.id === activeSection)?.description && (
                      <p className="text-sm text-gray-500 mb-4">
                        {template.sections.find(section => section.id === activeSection)?.description}
                      </p>
                    )}
                    <div className="space-y-4">
                      {template.sections
                        .find(section => section.id === activeSection)
                        ?.fields.map(field => renderField(field))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Render fields for backward compatibility
              <div className="space-y-4">
                {template.fields?.map(field => renderField(field))}
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              type="button"
              onClick={testFormSubmission}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Test Form
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset Form
            </button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`rounded-md p-4 ${
              testResult.valid ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {testResult.valid ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                )}
              </div>
              <div className="ml-3">
                <h3
                  className={`text-sm font-medium ${
                    testResult.valid ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {testResult.message}
                </h3>
                {testResult.details && (
                  <div
                    className={`mt-2 text-sm ${
                      testResult.valid ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    <p>{testResult.details}</p>
                  </div>
                )}
                {testResult.errors && testResult.errors.length > 0 && (
                  <div className="mt-2">
                    <ul className="list-disc pl-5 space-y-1">
                      {testResult.errors.map((error, index) => {
                        // Find the field label
                        const allFields = template?.sections
                          ? template.sections.flatMap(section => section.fields)
                          : template?.fields || [];
                        const field = allFields.find(f => f.name === error.fieldName);
                        const fieldLabel = field ? field.label : error.fieldName;

                        return (
                          <li key={index} className="text-sm text-red-700">
                            {fieldLabel}: {error.message}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
