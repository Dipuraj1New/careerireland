import React from 'react';
import Link from 'next/link';
import { Case, CaseStatus, CASE_STATUS_LABELS, VISA_TYPE_LABELS, CASE_PRIORITY_LABELS } from '@/types/case';

interface CaseOverviewProps {
  caseData: Case;
  showActions?: boolean;
}

const CaseOverview: React.FC<CaseOverviewProps> = ({ caseData, showActions = true }) => {
  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Get status badge color
  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case CaseStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case CaseStatus.SUBMITTED:
        return 'bg-blue-100 text-blue-800';
      case CaseStatus.IN_REVIEW:
        return 'bg-yellow-100 text-yellow-800';
      case CaseStatus.ADDITIONAL_INFO_REQUIRED:
        return 'bg-orange-100 text-orange-800';
      case CaseStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case CaseStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case CaseStatus.WITHDRAWN:
        return 'bg-gray-100 text-gray-800';
      case CaseStatus.COMPLETED:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'standard':
        return 'bg-blue-100 text-blue-800';
      case 'expedited':
        return 'bg-orange-100 text-orange-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate days since submission
  const getDaysSinceSubmission = () => {
    if (!caseData.submissionDate) return null;
    
    const submissionDate = new Date(caseData.submissionDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - submissionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysSinceSubmission = getDaysSinceSubmission();

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium">Case Overview</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(caseData.status)}`}>
          {CASE_STATUS_LABELS[caseData.status]}
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Case Details</h3>
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-xs text-gray-500">Case ID</p>
                <p className="text-sm font-medium">{caseData.id}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Visa Type</p>
                <p className="text-sm font-medium">{VISA_TYPE_LABELS[caseData.visaType]}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Priority</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(caseData.priority)}`}>
                  {CASE_PRIORITY_LABELS[caseData.priority]}
                </span>
              </div>
              
              {caseData.notes && (
                <div>
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm">{caseData.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Timeline</h3>
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm font-medium">{formatDate(caseData.createdAt)}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Submitted</p>
                <p className="text-sm font-medium">{formatDate(caseData.submissionDate)}</p>
              </div>
              
              {daysSinceSubmission !== null && (
                <div>
                  <p className="text-xs text-gray-500">Days Since Submission</p>
                  <p className="text-sm font-medium">{daysSinceSubmission} days</p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-gray-500">Decision Date</p>
                <p className="text-sm font-medium">{formatDate(caseData.decisionDate)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/cases/${caseData.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Details
            </Link>
            
            <Link
              href={`/documents?caseId=${caseData.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Manage Documents
            </Link>
            
            {caseData.status === CaseStatus.DRAFT && (
              <Link
                href={`/cases/${caseData.id}/submit`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Submit Application
              </Link>
            )}
            
            {caseData.status === CaseStatus.ADDITIONAL_INFO_REQUIRED && (
              <Link
                href={`/cases/${caseData.id}/respond`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Provide Additional Info
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseOverview;
