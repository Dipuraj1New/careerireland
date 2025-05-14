'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Case, CaseStatus, CASE_STATUS_LABELS } from '@/types/case';
import { AuditLog } from '@/types/audit';
import { Document } from '@/types/document';
import CaseOverview from '@/components/cases/CaseOverview';
import CaseTimeline from '@/components/cases/CaseTimeline';
import DocumentChecklist from '@/components/cases/DocumentChecklist';
import { UserRole } from '@/types/user';

interface AgentCaseDetailProps {
  caseData: Case & { documents: Document[] };
  caseHistory: AuditLog[];
  userRole: UserRole;
}

export default function AgentCaseDetail({ 
  caseData, 
  caseHistory,
  userRole
}: AgentCaseDetailProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | null>(null);

  // Get available status transitions based on current status
  const getAvailableStatusTransitions = () => {
    switch (caseData.status) {
      case CaseStatus.SUBMITTED:
        return [CaseStatus.IN_REVIEW, CaseStatus.REJECTED, CaseStatus.WITHDRAWN];
      case CaseStatus.IN_REVIEW:
        return [CaseStatus.ADDITIONAL_INFO_REQUIRED, CaseStatus.APPROVED, CaseStatus.REJECTED];
      case CaseStatus.ADDITIONAL_INFO_REQUIRED:
        return [CaseStatus.IN_REVIEW];
      case CaseStatus.APPROVED:
        return [CaseStatus.COMPLETED];
      default:
        return [];
    }
  };

  const availableTransitions = getAvailableStatusTransitions();

  const handleStatusUpdate = (status: CaseStatus) => {
    setSelectedStatus(status);
    setShowNotesModal(true);
  };

  const submitStatusUpdate = async () => {
    if (!selectedStatus) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      const response = await fetch(`/api/cases/${caseData.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          status: selectedStatus,
          notes: statusNotes,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      // Close modal and refresh
      setShowNotesModal(false);
      setStatusNotes('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Case Overview */}
        <CaseOverview caseData={caseData} showActions={false} />
        
        {/* Agent Actions */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Agent Actions</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Status Update Actions */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {availableTransitions.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {CASE_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Assignment Action */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Case Assignment</h3>
              <Link
                href={`/agent/cases/${caseData.id}/assign`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {caseData.agentId ? 'Reassign Case' : 'Assign Case'}
              </Link>
            </div>
            
            {/* Document Management */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Document Management</h3>
              <Link
                href={`/documents?caseId=${caseData.id}`}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Manage Documents
              </Link>
            </div>
          </div>
        </div>
        
        {/* Case Timeline */}
        <CaseTimeline history={caseHistory} />
        
        {/* Document Checklist */}
        <DocumentChecklist 
          caseId={caseData.id} 
          visaType={caseData.visaType} 
          documents={caseData.documents || []} 
        />
      </div>
      
      {/* Status Update Modal */}
      {showNotesModal && selectedStatus && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">
              Update Status to {CASE_STATUS_LABELS[selectedStatus]}
            </h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="status-notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Required)
              </label>
              <textarea
                id="status-notes"
                rows={4}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter notes about this status change..."
                disabled={isUpdating}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                disabled={isUpdating}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitStatusUpdate}
                disabled={isUpdating || !statusNotes.trim()}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  isUpdating || !statusNotes.trim()
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
