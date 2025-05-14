'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FormSubmission, FormSubmissionStatus } from '../../types/form';
import FormPreview from './FormPreview';

interface FormEditorProps {
  formSubmissionId: string;
  readOnly?: boolean;
}

export default function FormEditor({ formSubmissionId, readOnly = false }: FormEditorProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [formSubmission, setFormSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Load form submission
  useEffect(() => {
    const loadFormSubmission = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/forms/submissions/${formSubmissionId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load form submission');
        }

        const data = await response.json();
        setFormSubmission(data.formSubmission);
      } catch (error: any) {
        setError(error.message || 'An error occurred while loading form submission');
      } finally {
        setLoading(false);
      }
    };

    if (formSubmissionId && session?.user) {
      loadFormSubmission();
    }
  }, [formSubmissionId, session]);

  // Handle form submission
  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/forms/submissions/${formSubmissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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

      // Show success message and redirect to submission confirmation
      alert('Form submitted successfully');
      router.push(`/forms/submissions/${formSubmissionId}/confirmation`);
    } catch (error: any) {
      setError(error.message || 'An error occurred while submitting form');
    } finally {
      setSaving(false);
    }
  };

  // Handle save draft
  const handleSaveDraft = async (formData: Record<string, any>) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/forms/submissions/${formSubmissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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

  // If form submission not found, show error
  if (!formSubmission) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium">Error</h3>
          <p>{error || 'Form submission not found'}</p>
        </div>
      </div>
    );
  }

  // If form is already submitted and not in read-only mode, show message
  if (formSubmission.status === FormSubmissionStatus.SUBMITTED && !readOnly) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-yellow-600">
          <h3 className="text-lg font-medium">Form Already Submitted</h3>
          <p>This form has already been submitted and cannot be edited.</p>
          <div className="mt-4">
            <button
              onClick={() => router.push(`/forms/submissions/${formSubmissionId}/view`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
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

      <FormPreview
        templateId={formSubmission.templateId}
        formSubmissionId={formSubmissionId}
        caseId={formSubmission.caseId}
        readOnly={readOnly}
        onSubmit={!readOnly ? handleSubmit : undefined}
        onSaveDraft={!readOnly ? handleSaveDraft : undefined}
      />
    </div>
  );
}
