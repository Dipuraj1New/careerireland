'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormSubmission, FormSubmissionStatus } from '../../types/form';
import { PortalSubmission, PortalSubmissionStatus } from '../../types/portal';
import FormPreview from './FormPreview';
import FormSubmissionTracker from './FormSubmissionTracker';
import Link from 'next/link';

interface FormReviewSubmissionUIProps {
  formSubmissionId: string;
}

export default function FormReviewSubmissionUI({ formSubmissionId }: FormReviewSubmissionUIProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [formSubmission, setFormSubmission] = useState<FormSubmission | null>(null);
  const [portalSubmission, setPortalSubmission] = useState<PortalSubmission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittingToPortal, setSubmittingToPortal] = useState<boolean>(false);
  const [reviewComplete, setReviewComplete] = useState<boolean>(false);

  // Fetch form submission data
  useEffect(() => {
    const fetchFormSubmission = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/forms/submissions/${formSubmissionId}`);
        if (!response.ok) {
          throw new Error('Failed to load form submission');
        }

        const data = await response.json();
        setFormSubmission(data.formSubmission);

        // Check if form has been submitted to portal
        try {
          const portalResponse = await fetch(`/api/forms/${formSubmissionId}/status`);
          if (portalResponse.ok) {
            const portalData = await portalResponse.json();
            setPortalSubmission(portalData.submission);
          }
        } catch (portalError) {
          // Portal submission might not exist yet, which is fine
          console.log('No portal submission found');
        }
      } catch (error: any) {
        setError(error.message || 'An error occurred while loading data');
      } finally {
        setLoading(false);
      }
    };

    if (formSubmissionId && session?.user) {
      fetchFormSubmission();
    }
  }, [formSubmissionId, session]);

  // Handle form submission
  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setSubmitting(true);
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
      setReviewComplete(true);

      // Show success message
      alert('Form submitted successfully');
    } catch (error: any) {
      setError(error.message || 'An error occurred while submitting form');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit to government portal
  const submitToPortal = async () => {
    try {
      setSubmittingToPortal(true);
      setError(null);

      const response = await fetch(`/api/forms/${formSubmissionId}/submit`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit to government portal');
      }

      const data = await response.json();
      setPortalSubmission(data.submission);

      // Show success message
      alert('Form has been submitted to the government portal');
      
      // Redirect to confirmation page
      router.push(`/forms/submissions/${formSubmissionId}/confirmation`);
    } catch (error: any) {
      setError(error.message || 'An error occurred while submitting to government portal');
    } finally {
      setSubmittingToPortal(false);
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

  // If error, show error state
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium">Error</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If form submission not found, show not found state
  if (!formSubmission) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-gray-600">
          <h3 className="text-lg font-medium">Form Not Found</h3>
          <p>The requested form submission could not be found.</p>
          <Link
            href="/forms/submissions"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Submissions
          </Link>
        </div>
      </div>
    );
  }

  // If form is already submitted and review is complete, show confirmation
  if (formSubmission.status === FormSubmissionStatus.SUBMITTED && reviewComplete) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">Form Review Complete</h3>
            <p className="mt-2 text-sm text-gray-500">
              Your form has been reviewed and is ready for submission to the government portal.
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={submitToPortal}
                disabled={submittingToPortal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submittingToPortal ? 'Submitting...' : 'Submit to Government Portal'}
              </button>
              <Link
                href="/forms/submissions"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Submissions
              </Link>
            </div>
          </div>
        </div>

        {/* Form Preview (Read-only) */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Form Preview</h3>
          <FormPreview
            templateId={formSubmission.templateId}
            formSubmissionId={formSubmissionId}
            caseId={formSubmission.caseId}
            readOnly={true}
          />
        </div>
      </div>
    );
  }

  // If form is already submitted but not reviewed yet, show submission status
  if (formSubmission.status === FormSubmissionStatus.SUBMITTED && !reviewComplete) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">Form Already Submitted</h3>
            <p className="mt-2 text-sm text-gray-500">
              This form has already been submitted. You can review it below.
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={() => setReviewComplete(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Complete Review
              </button>
              <Link
                href="/forms/submissions"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Submissions
              </Link>
            </div>
          </div>
        </div>

        {/* Form Preview (Read-only) */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Form Preview</h3>
          <FormPreview
            templateId={formSubmission.templateId}
            formSubmissionId={formSubmissionId}
            caseId={formSubmission.caseId}
            readOnly={true}
          />
        </div>
      </div>
    );
  }

  // Default view - Form review and edit
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Review and Submit Form</h3>
        <p className="text-sm text-gray-500 mb-4">
          Please review the form details below. Make any necessary changes before submitting.
        </p>
        
        <FormPreview
          templateId={formSubmission.templateId}
          formSubmissionId={formSubmissionId}
          caseId={formSubmission.caseId}
          readOnly={false}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
