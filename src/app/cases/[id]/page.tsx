'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import CaseOverview from '@/components/cases/CaseOverview';
import CaseTimeline from '@/components/cases/CaseTimeline';
import DocumentChecklist from '@/components/cases/DocumentChecklist';
import EnhancedAgentCaseDetail from '@/components/agent/EnhancedAgentCaseDetail';
import { Case } from '@/types/case';
import { AuditLog } from '@/types/audit';
import { UserRole } from '@/types/user';

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<Case & { documents: any[] } | null>(null);
  const [caseHistory, setCaseHistory] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Fetch case data and user role
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user data
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await userResponse.json();
        setUserRole(userData.user.role);

        // Get case data
        const caseResponse = await fetch(`/api/cases/${caseId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!caseResponse.ok) {
          throw new Error('Failed to fetch case data');
        }

        const caseResult = await caseResponse.json();
        setCaseData(caseResult.case);

        // Get case history
        const historyResponse = await fetch(`/api/cases/${caseId}/history`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (historyResponse.ok) {
          const historyResult = await historyResponse.json();
          setCaseHistory(historyResult.history || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load case data. Please try again.');

        // Redirect to login on auth error
        if (err instanceof Error && err.message.includes('Unauthorized')) {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (caseId) {
      fetchData();
    }
  }, [caseId, router]);

  // Handle case status update
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update case status');
      }

      // Refresh case data
      window.location.reload();
    } catch (err) {
      console.error('Error updating case status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update case status');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-600">{error || 'Case not found'}</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Determine if user is an agent or admin
  const isAgentOrAdmin = userRole === UserRole.AGENT || userRole === UserRole.ADMIN;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Case Details</h1>
          <p className="text-gray-600">
            {isAgentOrAdmin
              ? 'Manage and process this immigration case'
              : 'View and manage your immigration application'}
          </p>
        </div>

        <div className="flex space-x-3">
          <Link
            href={isAgentOrAdmin ? "/agent/cases" : "/dashboard"}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isAgentOrAdmin ? 'Back to Case Queue' : 'Back to Dashboard'}
          </Link>

          <Link
            href={`/documents?caseId=${caseId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Manage Documents
          </Link>
        </div>
      </div>

      {/* Render different views based on user role */}
      {isAgentOrAdmin && userRole ? (
        <EnhancedAgentCaseDetail
          caseData={caseData}
          caseHistory={caseHistory}
          userRole={userRole}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Case Overview */}
            <CaseOverview caseData={caseData} showActions={false} />

            {/* Case Timeline */}
            <CaseTimeline history={caseHistory} />
          </div>

          <div className="space-y-6">
            {/* Document Checklist */}
            <DocumentChecklist
              caseId={caseId}
              visaType={caseData.visaType}
              documents={caseData.documents || []}
            />

            {/* Case Actions */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium">Case Actions</h2>
              </div>
              <div className="p-6 space-y-4">
                {caseData.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('submitted')}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Submit Application
                  </button>
                )}

                {caseData.status === 'additional_info_required' && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('in_review')}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Submit Additional Information
                  </button>
                )}

                {['draft', 'submitted', 'in_review', 'additional_info_required'].includes(caseData.status) && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('withdrawn')}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Withdraw Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
