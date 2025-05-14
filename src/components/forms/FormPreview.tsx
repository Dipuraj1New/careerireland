'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FormField, FormTemplate, FormSubmission, FormSubmissionStatus } from '../../types/form';
import FormPreviewButton from './FormPreviewButton';

interface FormPreviewProps {
  templateId: string;
  formSubmissionId?: string;
  caseId?: string;
  readOnly?: boolean;
  onSubmit?: (formData: Record<string, any>) => void;
  onSaveDraft?: (formData: Record<string, any>) => void;
}

export default function FormPreview({
  templateId,
  formSubmissionId,
  caseId,
  readOnly = false,
  onSubmit,
  onSaveDraft,
}: FormPreviewProps) {
  const { data: session } = useSession();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formSubmission, setFormSubmission] = useState<FormSubmission | null>(null);

  // Load form template and form submission (if editing)
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
        templateData.template.fields.forEach((field: FormField) => {
          initialData[field.name] = field.defaultValue || '';
        });

        // If formSubmissionId is provided, load existing form submission
        if (formSubmissionId) {
          const submissionResponse = await fetch(`/api/forms/submissions/${formSubmissionId}`);
          if (!submissionResponse.ok) {
            throw new Error('Failed to load form submission');
          }
          const submissionData = await submissionResponse.json();
          setFormSubmission(submissionData.formSubmission);

          // Merge form data with existing submission data
          Object.assign(initialData, submissionData.formSubmission.formData);
        }

        setFormData(initialData);
      } catch (error: any) {
        setError(error.message || 'An error occurred while loading data');
      } finally {
        setLoading(false);
      }
    };

    if (templateId && session?.user) {
      loadData();
    }
  }, [templateId, formSubmissionId, session]);

  // Handle form field changes
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (readOnly) return;

    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Check required fields
    template?.fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        errors[field.name] = `${field.label} is required`;
        isValid = false;
      }
    });

    // Apply validation rules (in a real implementation, this would call the validation service)
    // For now, we'll just check required fields

    setFormErrors(errors);
    return isValid;
  };

  // Save form as draft
  const handleSaveDraft = async () => {
    if (readOnly) return;

    try {
      setSaving(true);
      setError(null);

      // Call onSaveDraft callback if provided
      if (onSaveDraft) {
        onSaveDraft(formData);
        return;
      }

      // Otherwise, save draft directly
      const url = formSubmissionId
        ? `/api/forms/submissions/${formSubmissionId}`
        : '/api/forms/submissions';

      const method = formSubmissionId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          caseId,
          formData,
          status: FormSubmissionStatus.DRAFT,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save draft');
      }

      const data = await response.json();
      setFormSubmission(data.formSubmission);

      // Show success message
      alert('Form draft saved successfully');
    } catch (error: any) {
      setError(error.message || 'An error occurred while saving draft');
    } finally {
      setSaving(false);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    const isValid = validateForm();
    if (!isValid) {
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(formData);
        return;
      }

      // Otherwise, submit form directly
      const url = formSubmissionId
        ? `/api/forms/submissions/${formSubmissionId}`
        : '/api/forms/submissions';

      const method = formSubmissionId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          caseId,
          formData,
          status: FormSubmissionStatus.SUBMITTED,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      const data = await response.json();
      setFormSubmission(data.formSubmission);

      // Show success message
      alert('Form submitted successfully');
    } catch (error: any) {
      setError(error.message || 'An error occurred while submitting form');
    } finally {
      setSubmitting(false);
    }
  };

  // If loading, show loading state
  if (loading) {
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

  // If template not found, show error
  if (!template) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium">Error</h3>
          <p>{error || 'Form template not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">{template.name}</h2>
        {template.description && (
          <p className="mt-1 text-sm text-gray-500">{template.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {template.fields.map((field) => (
          <div key={field.id} className="space-y-1">
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
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  formErrors[field.name]
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } ${readOnly ? 'bg-gray-50' : ''}`}
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
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  formErrors[field.name]
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } ${readOnly ? 'bg-gray-50' : ''}`}
              />
            )}

            {field.type === 'date' && (
              <input
                type="date"
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleFieldChange}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  formErrors[field.name]
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } ${readOnly ? 'bg-gray-50' : ''}`}
              />
            )}

            {field.type === 'select' && (
              <select
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleFieldChange}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  formErrors[field.name]
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } ${readOnly ? 'bg-gray-50' : ''}`}
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
              <div className="mt-1">
                <input
                  type="checkbox"
                  id={field.name}
                  name={field.name}
                  checked={formData[field.name] || false}
                  onChange={handleFieldChange}
                  disabled={readOnly}
                  className={`h-4 w-4 rounded ${
                    formErrors[field.name]
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  } ${readOnly ? 'bg-gray-50' : ''}`}
                />
                <label htmlFor={field.name} className="ml-2 text-sm text-gray-700">
                  {field.placeholder || 'Yes'}
                </label>
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
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  formErrors[field.name]
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } ${readOnly ? 'bg-gray-50' : ''}`}
              />
            )}

            {formErrors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{formErrors[field.name]}</p>
            )}
          </div>
        ))}

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

        {!readOnly && (
          <div className="flex justify-end space-x-3">
            <FormPreviewButton
              templateId={templateId}
              formData={formData}
              disabled={saving || submitting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
