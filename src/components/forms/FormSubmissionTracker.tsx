'use client';

import { useState, useEffect } from 'react';
import { PortalSubmission, PortalSubmissionStatus } from '../../types/portal';
import { useSession } from 'next-auth/react';
import { UserRole } from '../../types/user';

interface FormSubmissionTrackerProps {
  formSubmissionId: string;
}

export default function FormSubmissionTracker({ formSubmissionId }: FormSubmissionTrackerProps) {
  const { data: session } = useSession();
  const [submission, setSubmission] = useState<PortalSubmission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<boolean>(false);
  
  // Fetch submission status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/forms/${formSubmissionId}/status`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch submission status');
      }
      
      const data = await response.json();
      setSubmission(data.submission);
    } catch (error: any) {
      setError(error.message || 'An error occurred while fetching submission status');
    } finally {
      setLoading(false);
    }
  };
  
  // Retry submission
  const retrySubmission = async () => {
    if (!submission) return;
    
    try {
      setRetrying(true);
      setError(null);
      
      const response = await fetch(`/api/portal/submissions/${submission.id}/retry`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry submission');
      }
      
      const data = await response.json();
      setSubmission(data.submission);
      
      // Show success message
      alert('Submission retry initiated successfully');
    } catch (error: any) {
      setError(error.message || 'An error occurred while retrying submission');
    } finally {
      setRetrying(false);
    }
  };
  
  // Fetch status on mount and periodically if in progress
  useEffect(() => {
    fetchStatus();
    
    // Set up polling if submission is in progress
    let interval: NodeJS.Timeout | null = null;
    
    if (
      submission &&
      (submission.status === PortalSubmissionStatus.PENDING ||
       submission.status === PortalSubmissionStatus.IN_PROGRESS ||
       submission.status === PortalSubmissionStatus.RETRYING)
    ) {
      interval = setInterval(fetchStatus, 10000); // Poll every 10 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [formSubmissionId, submission?.status]);
  
  // Render status badge
  const renderStatusBadge = (status: PortalSubmissionStatus) => {
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
            Unknown
          </span>
        );
    }
  };
  
  // Check if user can retry submission
  const canRetry = () => {
    if (!session || !submission) return false;
    
    // Only agents and admins can retry submissions
    if (session.user.role !== UserRole.AGENT && session.user.role !== UserRole.ADMIN) {
      return false;
    }
    
    // Only failed or retrying submissions can be retried
    return (
      submission.status === PortalSubmissionStatus.FAILED ||
      submission.status === PortalSubmissionStatus.RETRYING
    );
  };
  
  if (loading && !submission) {
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
  
  if (error && !submission) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-medium">Error</h3>
          <p>{error}</p>
        </div>
        <button
          onClick={fetchStatus}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!submission) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">No submission information available.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Submission Status</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Status</p>
          <div className="mt-1">{renderStatusBadge(submission.status)}</div>
        </div>
        
        {submission.confirmationNumber && (
          <div>
            <p className="text-sm font-medium text-gray-500">Confirmation Number</p>
            <p className="mt-1 text-sm text-gray-900">{submission.confirmationNumber}</p>
          </div>
        )}
        
        {submission.confirmationReceiptUrl && (
          <div>
            <p className="text-sm font-medium text-gray-500">Confirmation Receipt</p>
            <div className="mt-1">
              <a
                href={submission.confirmationReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-500"
              >
                View Receipt
              </a>
            </div>
          </div>
        )}
        
        {submission.errorMessage && (
          <div>
            <p className="text-sm font-medium text-gray-500">Error</p>
            <p className="mt-1 text-sm text-red-600">{submission.errorMessage}</p>
          </div>
        )}
        
        <div>
          <p className="text-sm font-medium text-gray-500">Last Updated</p>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(submission.updatedAt).toLocaleString()}
          </p>
        </div>
        
        {submission.lastAttemptAt && (
          <div>
            <p className="text-sm font-medium text-gray-500">Last Attempt</p>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(submission.lastAttemptAt).toLocaleString()}
            </p>
          </div>
        )}
        
        {submission.retryCount > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-500">Retry Count</p>
            <p className="mt-1 text-sm text-gray-900">{submission.retryCount}</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex space-x-3">
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Refreshing...' : 'Refresh Status'}
        </button>
        
        {canRetry() && (
          <button
            onClick={retrySubmission}
            disabled={retrying}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {retrying ? 'Retrying...' : 'Retry Submission'}
          </button>
        )}
      </div>
      
      {error && (
        <div className="mt-4 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
