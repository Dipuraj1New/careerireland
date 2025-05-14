'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '../../types/user';

interface ValidationRule {
  id: string;
  templateId: string;
  fieldName: string;
  ruleType: 'required' | 'pattern' | 'minLength' | 'maxLength' | 'min' | 'max' | 'custom' | 'crossField' | 'conditional';
  ruleValue: string;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
  relatedFields?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ValidationRuleCreateData {
  templateId: string;
  fieldName: string;
  ruleType: 'required' | 'pattern' | 'minLength' | 'maxLength' | 'min' | 'max' | 'custom' | 'crossField' | 'conditional';
  ruleValue: string;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
  relatedFields?: string[];
}

interface FormField {
  id?: string;
  name: string;
  label: string;
  type: string;
  section?: string;
}

interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

interface ValidationRuleConfigProps {
  templateId: string;
}

export default function ValidationRuleConfig({ templateId }: ValidationRuleConfigProps) {
  const { data: session } = useSession();
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formSections, setFormSections] = useState<FormSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [showRuleForm, setShowRuleForm] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<ValidationRuleCreateData>({
    templateId,
    fieldName: '',
    ruleType: 'required',
    ruleValue: '',
    errorMessage: '',
    severity: 'error',
    relatedFields: [],
  });

  // Check if user is authorized (admin only)
  useEffect(() => {
    if (session && session.user && session.user.role !== UserRole.ADMIN) {
      // Redirect or show error
      setError('Only administrators can access this page');
    }
  }, [session]);

  // Load form template fields and existing validation rules
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

        // Check if template has sections
        if (templateData.template.sections) {
          // Store sections
          setFormSections(templateData.template.sections);

          // Extract fields from sections
          const allFields = templateData.template.sections.flatMap((section: FormSection) =>
            section.fields.map((field: FormField) => ({
              id: field.id,
              name: field.name,
              label: field.label,
              type: field.type,
              section: section.title
            }))
          );
          setFormFields(allFields);
        } else if (templateData.template.fields) {
          // For backward compatibility with templates that don't have sections
          const fields = templateData.template.fields.map((field: any) => ({
            id: field.id || `field_${field.name}`,
            name: field.name,
            label: field.label,
            type: field.type,
          }));
          setFormFields(fields);
        }

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

  // Handle new rule form changes
  const handleRuleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Special handling for related fields (multi-select)
    if (name === 'relatedFields' && e.target instanceof HTMLSelectElement) {
      const options = e.target.options;
      const selectedFields = [];
      for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
          selectedFields.push(options[i].value);
        }
      }
      setNewRule({
        ...newRule,
        relatedFields: selectedFields,
      });
    } else if (name === 'severity') {
      setNewRule({
        ...newRule,
        severity: value as 'error' | 'warning' | 'info',
      });
    } else {
      setNewRule({
        ...newRule,
        [name]: value,
      });
    }
  };

  // Add new validation rule
  const addRule = async () => {
    if (!newRule.fieldName || !newRule.ruleType) {
      setError('Field name and rule type are required');
      return;
    }

    if (newRule.ruleType !== 'required' && !newRule.ruleValue) {
      setError('Rule value is required for this rule type');
      return;
    }

    if (!newRule.errorMessage) {
      setError('Error message is required');
      return;
    }

    // Validate related fields for cross-field validation
    if ((newRule.ruleType === 'crossField' || newRule.ruleType === 'conditional') &&
        (!newRule.relatedFields || newRule.relatedFields.length === 0)) {
      setError('At least one related field must be selected for cross-field validation');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const url = editingRuleId
        ? `/api/forms/templates/${templateId}/validation-rules/${editingRuleId}`
        : `/api/forms/templates/${templateId}/validation-rules`;

      const method = editingRuleId ? 'PATCH' : 'POST';

      // Prepare the rule data
      const ruleData = {
        ...newRule,
        // Only include relatedFields if they are needed
        relatedFields: ['crossField', 'conditional'].includes(newRule.ruleType)
          ? newRule.relatedFields
          : undefined
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingRuleId ? 'update' : 'create'} validation rule`);
      }

      // Reload validation rules
      const rulesResponse = await fetch(`/api/forms/templates/${templateId}/validation-rules`);
      if (!rulesResponse.ok) {
        throw new Error('Failed to load validation rules');
      }
      const rulesData = await rulesResponse.json();
      setValidationRules(rulesData.validationRules);

      // Reset form
      setNewRule({
        templateId,
        fieldName: '',
        ruleType: 'required',
        ruleValue: '',
        errorMessage: '',
        severity: 'error',
        relatedFields: [],
      });
      setEditingRuleId(null);
      setShowRuleForm(false);
    } catch (error: any) {
      setError(error.message || 'An error occurred while saving validation rule');
    } finally {
      setSaving(false);
    }
  };

  // Edit validation rule
  const editRule = (rule: ValidationRule) => {
    setNewRule({
      templateId,
      fieldName: rule.fieldName,
      ruleType: rule.ruleType,
      ruleValue: rule.ruleValue,
      errorMessage: rule.errorMessage,
      severity: rule.severity || 'error',
      relatedFields: rule.relatedFields || [],
    });
    setEditingRuleId(rule.id);
    setShowRuleForm(true);
  };

  // Delete validation rule
  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this validation rule?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/forms/templates/${templateId}/validation-rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete validation rule');
      }

      // Update local state
      setValidationRules(validationRules.filter((rule) => rule.id !== ruleId));
    } catch (error: any) {
      setError(error.message || 'An error occurred while deleting validation rule');
    } finally {
      setSaving(false);
    }
  };

  // Get field label by name
  const getFieldLabel = (fieldName: string) => {
    const field = formFields.find((f) => f.name === fieldName);
    return field ? field.label : fieldName;
  };

  // Get rule type display name
  const getRuleTypeDisplay = (ruleType: string) => {
    switch (ruleType) {
      case 'required':
        return 'Required';
      case 'pattern':
        return 'Pattern (Regex)';
      case 'minLength':
        return 'Minimum Length';
      case 'maxLength':
        return 'Maximum Length';
      case 'min':
        return 'Minimum Value';
      case 'max':
        return 'Maximum Value';
      case 'custom':
        return 'Custom Validation';
      case 'crossField':
        return 'Cross-Field Validation';
      case 'conditional':
        return 'Conditional Validation';
      default:
        return ruleType;
    }
  };

  // Get severity display name and color
  const getSeverityDisplay = (severity: string) => {
    switch (severity) {
      case 'error':
        return { label: 'Error', color: 'text-red-600 bg-red-100' };
      case 'warning':
        return { label: 'Warning', color: 'text-yellow-600 bg-yellow-100' };
      case 'info':
        return { label: 'Info', color: 'text-blue-600 bg-blue-100' };
      default:
        return { label: severity, color: 'text-gray-600 bg-gray-100' };
    }
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
  if (loading && !formFields.length) {
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

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Validation Rules Configuration</h2>

      <div className="space-y-6">
        {/* Existing Rules */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-900">Existing Rules</h3>
            <button
              type="button"
              onClick={() => setShowRuleForm(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Rule
            </button>
          </div>

          {validationRules.length === 0 ? (
            <p className="text-sm text-gray-500">No validation rules defined yet.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Field
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Rule Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Severity
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Value
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Error Message
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {validationRules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {getFieldLabel(rule.fieldName)} ({rule.fieldName})
                        </div>
                        {(rule.ruleType === 'crossField' || rule.ruleType === 'conditional') && rule.relatedFields && rule.relatedFields.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Related: {rule.relatedFields.map(fieldName => getFieldLabel(fieldName)).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getRuleTypeDisplay(rule.ruleType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {rule.severity && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityDisplay(rule.severity).color}`}>
                            {getSeverityDisplay(rule.severity).label}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rule.ruleValue || (rule.ruleType === 'required' ? 'true' : '')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {rule.errorMessage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => editRule(rule)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRule(rule.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rule Form */}
        {showRuleForm && (
          <div className="mt-6 p-4 border border-gray-300 rounded-md bg-gray-50">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              {editingRuleId ? 'Edit Validation Rule' : 'Add Validation Rule'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="fieldName" className="block text-sm font-medium text-gray-700">
                    Field
                  </label>
                  <select
                    id="fieldName"
                    name="fieldName"
                    value={newRule.fieldName}
                    onChange={handleRuleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a field</option>
                    {formFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.label} ({field.name}) {field.section && `- ${field.section}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="ruleType" className="block text-sm font-medium text-gray-700">
                    Rule Type
                  </label>
                  <select
                    id="ruleType"
                    name="ruleType"
                    value={newRule.ruleType}
                    onChange={handleRuleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="required">Required</option>
                    <option value="pattern">Pattern (Regex)</option>
                    <option value="minLength">Minimum Length</option>
                    <option value="maxLength">Maximum Length</option>
                    <option value="min">Minimum Value</option>
                    <option value="max">Maximum Value</option>
                    <option value="custom">Custom Validation</option>
                    <option value="crossField">Cross-Field Validation</option>
                    <option value="conditional">Conditional Validation</option>
                  </select>
                </div>
              </div>

              {/* Severity Selection */}
              <div>
                <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
                  Severity
                </label>
                <select
                  id="severity"
                  name="severity"
                  value={newRule.severity}
                  onChange={handleRuleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Error: Prevents form submission. Warning: Shows warning but allows submission. Info: Informational only.
                </p>
              </div>

              {/* Related Fields for Cross-Field Validation */}
              {(newRule.ruleType === 'crossField' || newRule.ruleType === 'conditional') && (
                <div>
                  <label htmlFor="relatedFields" className="block text-sm font-medium text-gray-700">
                    Related Fields
                  </label>
                  <select
                    id="relatedFields"
                    name="relatedFields"
                    multiple
                    value={newRule.relatedFields || []}
                    onChange={handleRuleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    size={4}
                  >
                    {formFields
                      .filter(field => field.name !== newRule.fieldName)
                      .map((field) => (
                        <option key={field.name} value={field.name}>
                          {field.label} ({field.name}) {field.section && `- ${field.section}`}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Hold Ctrl/Cmd to select multiple fields
                  </p>
                </div>
              )}

              {newRule.ruleType !== 'required' && (
                <div>
                  <label htmlFor="ruleValue" className="block text-sm font-medium text-gray-700">
                    Rule Value
                  </label>
                  <input
                    type={
                      newRule.ruleType === 'minLength' || newRule.ruleType === 'maxLength' ||
                      newRule.ruleType === 'min' || newRule.ruleType === 'max'
                        ? 'number'
                        : 'text'
                    }
                    id="ruleValue"
                    name="ruleValue"
                    value={newRule.ruleValue}
                    onChange={handleRuleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder={
                      newRule.ruleType === 'pattern'
                        ? 'e.g., ^[A-Za-z]+$'
                        : newRule.ruleType === 'minLength' || newRule.ruleType === 'maxLength'
                        ? 'e.g., 5'
                        : newRule.ruleType === 'min' || newRule.ruleType === 'max'
                        ? 'e.g., 18'
                        : newRule.ruleType === 'crossField'
                        ? 'e.g., (value, formValues) => value === formValues.password'
                        : newRule.ruleType === 'conditional'
                        ? 'e.g., (value, formValues) => !formValues.isCompany || value'
                        : 'e.g., value => value.includes("@")'
                    }
                  />
                  {newRule.ruleType === 'pattern' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Enter a valid JavaScript regular expression pattern
                    </p>
                  )}
                  {newRule.ruleType === 'custom' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Enter a JavaScript function that takes the value and returns true/false
                    </p>
                  )}
                  {newRule.ruleType === 'crossField' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Enter a JavaScript function that takes the current value and all form values and returns true/false
                    </p>
                  )}
                  {newRule.ruleType === 'conditional' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Enter a JavaScript function that defines when this validation should be applied
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="errorMessage" className="block text-sm font-medium text-gray-700">
                  Error Message
                </label>
                <textarea
                  id="errorMessage"
                  name="errorMessage"
                  value={newRule.errorMessage}
                  onChange={handleRuleChange}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., This field is required"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRuleForm(false);
                    setNewRule({
                      templateId,
                      fieldName: '',
                      ruleType: 'required',
                      ruleValue: '',
                      errorMessage: '',
                      severity: 'error',
                      relatedFields: [],
                    });
                    setEditingRuleId(null);
                    setError(null);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addRule}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingRuleId ? 'Update Rule' : 'Add Rule'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
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
