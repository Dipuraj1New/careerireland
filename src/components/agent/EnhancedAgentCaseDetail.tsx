'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Case, CaseStatus, CASE_STATUS_LABELS } from '@/types/case';
import { AuditLog } from '@/types/audit';
import { Document, DocumentStatus, DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/document';
import CaseOverview from '@/components/cases/CaseOverview';
import CaseTimeline from '@/components/cases/CaseTimeline';
import DocumentChecklist from '@/components/cases/DocumentChecklist';
import { UserRole } from '@/types/user';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { Tab } from '@headlessui/react';

interface EnhancedAgentCaseDetailProps {
  caseData: Case & { documents: Document[] };
  caseHistory: AuditLog[];
  userRole: UserRole;
}

export default function EnhancedAgentCaseDetail({ 
  caseData, 
  caseHistory,
  userRole
}: EnhancedAgentCaseDetailProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [caseNotes, setCaseNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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

  // Load case notes when component mounts
  useEffect(() => {
    const fetchCaseNotes = async () => {
      try {
        const response = await fetch(`/api/cases/${caseData.id}/notes`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setCaseNotes(data.notes || '');
        }
      } catch (err) {
        console.error('Error fetching case notes:', err);
      }
    };
    
    fetchCaseNotes();
  }, [caseData.id]);

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

  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      
      const response = await fetch(`/api/cases/${caseData.id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          notes: caseNotes,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save notes');
      }
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

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

  return (
    <>
      <div className="space-y-6">
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1">
            <Tab 
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
              }
            >
              Overview
            </Tab>
            <Tab 
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
              }
            >
              Documents
            </Tab>
            <Tab 
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
              }
            >
              Timeline
            </Tab>
            <Tab 
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
              }
            >
              Notes
            </Tab>
          </Tab.List>
          <Tab.Panels>
            {/* Overview Panel */}
            <Tab.Panel>
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
              </div>
            </Tab.Panel>
            
            {/* Documents Panel */}
            <Tab.Panel>
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium">Document Review</h2>
                    <Link
                      href={`/documents?caseId=${caseData.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Manage Documents
                    </Link>
                  </div>
                  <div className="p-6">
                    {caseData.documents && caseData.documents.length > 0 ? (
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Document Type</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Uploaded</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {caseData.documents.map((document) => (
                              <tr key={document.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                  {DOCUMENT_TYPE_LABELS[document.type]}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    document.status === DocumentStatus.VERIFIED 
                                      ? 'bg-green-100 text-green-800' 
                                      : document.status === DocumentStatus.REJECTED
                                      ? 'bg-red-100 text-red-800'
                                      : document.status === DocumentStatus.PROCESSING
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {document.status}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  {formatDate(document.createdAt)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  <Link
                                    href={`/documents/${document.id}`}
                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                  >
                                    View
                                  </Link>
                                  <Link
                                    href={`/documents/${document.id}/verify`}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Verify
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No documents uploaded yet</p>
                    )}
                  </div>
                </div>
                
                <DocumentChecklist 
                  caseId={caseData.id} 
                  visaType={caseData.visaType} 
                  documents={caseData.documents || []} 
                />
              </div>
            </Tab.Panel>
            
            {/* Timeline Panel */}
            <Tab.Panel>
              <CaseTimeline history={caseHistory} />
            </Tab.Panel>
            
            {/* Notes Panel */}
            <Tab.Panel>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium">Case Notes</h2>
                </div>
                <div className="p-6">
                  <textarea
                    rows={8}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Add notes about this case..."
                    value={caseNotes}
                    onChange={(e) => setCaseNotes(e.target.value)}
                  ></textarea>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        isSavingNotes ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {isSavingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
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
                Notes (required)
              </label>
              <textarea
                id="status-notes"
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Add notes about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                disabled={isUpdating}
              ></textarea>
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
