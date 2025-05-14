'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FormSubmission, FormSubmissionStatus } from '../../types/form';
import { PortalSubmission, PortalSubmissionStatus } from '../../types/portal';
import Link from 'next/link';

interface SubmissionTrackingUIProps {
  caseId?: string;
  userId?: string;
}

export default function SubmissionTrackingUI({ caseId, userId }: SubmissionTrackingUIProps) {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [portalSubmissions, setPortalSubmissions] = useState<Record<string, PortalSubmission>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load form submissions
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construct query parameters
        const params = new URLSearchParams();
        if (caseId) {
          params.append('caseId', caseId);
        }
        if (userId) {
          params.append('userId', userId);
        }

        // Load form submissions
        const response = await fetch(`/api/forms/submissions?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load form submissions');
        }

        const data = await response.json();
        setSubmissions(data.formSubmissions);

        // Load portal submissions for submitted forms
        const submittedForms = data.formSubmissions.filter(
          (submission: FormSubmission) => submission.status === FormSubmissionStatus.SUBMITTED
        );

        const portalData: Record<string, PortalSubmission> = {};

        await Promise.all(
          submittedForms.map(async (submission: FormSubmission) => {
            try {
              const portalResponse = await fetch(`/api/forms/${submission.id}/status`);

              if (portalResponse.ok) {
                const portalResponseData = await portalResponse.json();
                if (portalResponseData.success && portalResponseData.submission) {
                  portalData[submission.id] = portalResponseData.submission;
                }
              }
            } catch (portalError) {
              // Portal submission might not exist yet, which is fine
              console.error(`Error loading portal submission for ${submission.id}:`, portalError);
            }
          })
        );

        setPortalSubmissions(portalData);
      } catch (error: any) {
        setError(error.message || 'An error occurred while loading submissions');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      loadSubmissions();
    }
  }, [caseId, userId, session]);

  // Get status badge for form submission
  const getFormStatusBadge = (status: FormSubmissionStatus) => {
    switch (status) {
      case FormSubmissionStatus.DRAFT:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Draft
          </span>
        );
      case FormSubmissionStatus.SUBMITTED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Submitted
          </span>
        );
      case FormSubmissionStatus.GENERATED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Generated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Get status badge for portal submission
  const getPortalStatusBadge = (status: PortalSubmissionStatus) => {
    switch (status) {
      case PortalSubmissionStatus.PENDING:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Pending
          </span>
        );
      case PortalSubmissionStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            In Progress
          </span>
        );
      case PortalSubmissionStatus.SUBMITTED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            Submitted
          </span>
        );
      case PortalSubmissionStatus.FAILED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Failed
          </span>
        );
      case PortalSubmissionStatus.RETRYING:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Retrying
          </span>
        );
      case PortalSubmissionStatus.COMPLETED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
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

  // If no submissions found, show message
  if (submissions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">No form submissions found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Form Submissions</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Track the status of your form submissions.
        </p>
      </div>

      <div className="border-t border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Form
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Submission Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Form Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Portal Status
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
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {submission.templateName || `Form #${submission.id.substring(0, 8)}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getFormStatusBadge(submission.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.status === FormSubmissionStatus.SUBMITTED && portalSubmissions[submission.id] ? (
                      getPortalStatusBadge(portalSubmissions[submission.id].status)
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {submission.status === FormSubmissionStatus.DRAFT ? (
                      <Link
                        href={`/forms/submissions/${submission.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </Link>
                    ) : (
                      <Link
                        href={`/forms/submissions/${submission.id}/view`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        View
                      </Link>
                    )}

                    {submission.status === FormSubmissionStatus.GENERATED && (
                      <Link
                        href={`/forms/review/${submission.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Review
                      </Link>
                    )}

                    {submission.status === FormSubmissionStatus.SUBMITTED && (
                      <Link
                        href={`/forms/submissions/${submission.id}/confirmation`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Track
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="px-4 py-5 sm:px-6">
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
        </div>
      )}
    </div>
  );
}
