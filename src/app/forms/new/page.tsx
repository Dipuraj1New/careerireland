'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import FormPreview from '../../../components/forms/FormPreview';

export default function NewFormPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const caseId = searchParams.get('caseId');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(templateId);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Load available templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/forms/templates');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load templates');
        }

        const data = await response.json();
        setTemplates(data.templates);

        // If templateId is provided in URL but not valid, show error
        if (templateId && !data.templates.some((t: any) => t.id === templateId)) {
          setError('Invalid template ID provided');
          setSelectedTemplateId(null);
        }
      } catch (error: any) {
        setError(error.message || 'An error occurred while loading templates');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      loadTemplates();
    }
  }, [session, templateId]);

  // Handle form submission
  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/forms/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          caseId,
          formData,
          status: 'SUBMITTED',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      const data = await response.json();
      
      // Redirect to confirmation page
      router.push(`/forms/submissions/${data.formSubmission.id}/confirmation`);
    } catch (error: any) {
      setError(error.message || 'An error occurred while submitting form');
      setLoading(false);
    }
  };

  // Handle save draft
  const handleSaveDraft = async (formData: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/forms/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          caseId,
          formData,
          status: 'DRAFT',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save draft');
      }

      const data = await response.json();
      
      // Redirect to edit page
      router.push(`/forms/submissions/${data.formSubmission.id}/edit`);
    } catch (error: any) {
      setError(error.message || 'An error occurred while saving draft');
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading' || (loading && templates.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Form</h1>
          <p className="mt-2 text-sm text-gray-500">
            Fill out and submit a new form.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
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

        {!selectedTemplateId ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Select a Form Template</h2>
            
            {templates.length === 0 ? (
              <p className="text-gray-500">No templates available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <h3 className="text-md font-medium text-gray-900">{template.name}</h3>
                    {template.description && (
                      <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">Version: {template.version}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <FormPreview
            templateId={selectedTemplateId}
            caseId={caseId || undefined}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
          />
        )}
      </div>
    </div>
  );
}
