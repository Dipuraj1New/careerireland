'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FormSubmission, FormSubmissionStatus } from '../../types/form';
import { PortalSubmission, PortalSubmissionStatus } from '../../types/portal';
import FormSubmissionTracker from './FormSubmissionTracker';

interface SubmissionConfirmationProps {
  formSubmissionId: string;
}

export default function SubmissionConfirmation({ formSubmissionId }: SubmissionConfirmationProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [formSubmission, setFormSubmission] = useState<FormSubmission | null>(null);
  const [portalSubmission, setPortalSubmission] = useState<PortalSubmission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingToPortal, setSubmittingToPortal] = useState<boolean>(false);

  // Load form submission and portal submission status
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load form submission
        const formResponse = await fetch(`/api/forms/submissions/${formSubmissionId}`);
        
        if (!formResponse.ok) {
          const errorData = await formResponse.json();
          throw new Error(errorData.error || 'Failed to load form submission');
        }

        const formData = await formResponse.json();
        setFormSubmission(formData.formSubmission);

        // Check if form is submitted
        if (formData.formSubmission.status !== FormSubmissionStatus.SUBMITTED) {
          throw new Error('Form has not been submitted yet');
        }

        // Try to load portal submission status
        try {
          const portalResponse = await fetch(`/api/forms/${formSubmissionId}/status`);
          
          if (portalResponse.ok) {
            const portalData = await portalResponse.json();
            if (portalData.success && portalData.submission) {
              setPortalSubmission(portalData.submission);
            }
          }
        } catch (portalError) {
          // Portal submission might not exist yet, which is fine
          console.error('Error loading portal submission:', portalError);
        }
      } catch (error: any) {
        setError(error.message || 'An error occurred while loading data');
      } finally {
        setLoading(false);
      }
    };

    if (formSubmissionId && session?.user) {
      loadData();
    }
  }, [formSubmissionId, session]);

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

  // If form submission not found or not submitted, show error
  if (!formSubmission || formSubmission.status !== FormSubmissionStatus.SUBMITTED) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium">Error</h3>
          <p>{error || 'Form submission not found or not submitted'}</p>
        </div>
      </div>
    );
  }

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
          <h3 className="mt-3 text-lg font-medium text-gray-900">Form Submitted Successfully</h3>
          <p className="mt-2 text-sm text-gray-500">
            Your form has been submitted successfully. You can view the details below.
          </p>
          <div className="mt-4">
            <button
              onClick={() => router.push(`/forms/submissions/${formSubmissionId}/view`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Form Details
            </button>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Submission ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{formSubmission.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Submission Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(formSubmission.updatedAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Submitted
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Case ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{formSubmission.caseId}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Government Portal Submission */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Government Portal Submission</h3>

        {portalSubmission ? (
          <FormSubmissionTracker formSubmissionId={formSubmissionId} />
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-4">
              This form has not been submitted to the government portal yet.
            </p>
            <button
              onClick={submitToPortal}
              disabled={submittingToPortal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {submittingToPortal ? 'Submitting...' : 'Submit to Government Portal'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
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

      {/* Next Steps */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Next Steps</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-500">
          <li>Your form has been submitted and is being processed.</li>
          <li>You can track the status of your submission using the tracking information above.</li>
          <li>You will receive notifications about any updates to your submission.</li>
          <li>If additional information is required, you will be contacted via email or phone.</li>
        </ul>
      </div>
    </div>
  );
}
