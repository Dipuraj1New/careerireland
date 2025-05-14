'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CaseOverview from '@/components/cases/CaseOverview';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { Case, CaseStatus, VISA_TYPE_LABELS } from '@/types/case';
import { UserRole } from '@/types/user';

export default function DashboardPage() {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  } | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Fetch cases after user is loaded
          fetchUserCases();
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  // Fetch user cases
  const fetchUserCases = async () => {
    try {
      setCasesLoading(true);
      setCasesError(null);

      const response = await fetch('/api/cases');
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }

      const data = await response.json();
      setCases(data.cases || []);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setCasesError('Failed to load your cases. Please try again.');
    } finally {
      setCasesLoading(false);
    }
  };

  // Get active case (most recently updated case that is not completed, withdrawn, or rejected)
  const getActiveCase = () => {
    const activeCases = cases.filter(c =>
      ![CaseStatus.COMPLETED, CaseStatus.WITHDRAWN, CaseStatus.REJECTED].includes(c.status)
    );

    if (activeCases.length === 0) {
      return null;
    }

    // Sort by updated date (newest first)
    return activeCases.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
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

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Welcome to Career Ireland Immigration</h2>

          <p className="mb-4">
            {cases.length > 0
              ? 'Manage your immigration applications and documents securely through our platform.'
              : 'Your account has been successfully created. You can now start using our platform to manage your immigration process.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Document Management</h3>
              <p className="text-blue-600 mb-4">
                Upload and manage your immigration documents securely.
              </p>
              <Link
                href="/documents"
                className="text-blue-700 hover:text-blue-900 font-medium"
              >
                Manage Documents →
              </Link>
            </div>

            <div className="bg-green-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-green-800 mb-2">Application Status</h3>
              <p className="text-green-600 mb-4">
                Track the status of your immigration applications.
              </p>
              <Link
                href="/cases"
                className="text-green-700 hover:text-green-900 font-medium"
              >
                View Applications →
              </Link>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-purple-800 mb-2">Expert Consultation</h3>
              <p className="text-purple-600 mb-4">
                Book consultations with immigration experts.
              </p>
              <Link
                href="/consultations"
                className="text-purple-700 hover:text-purple-900 font-medium"
              >
                Book Consultation →
              </Link>
            </div>
          </div>
        </div>

        {/* Case Management Section */}
        {user && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Applications</h2>
              {user.role === UserRole.APPLICANT && (
                <Link
                  href="/cases/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  New Application
                </Link>
              )}
            </div>

            {casesLoading ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Loading your applications...</p>
              </div>
            ) : casesError ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-red-600">{casesError}</p>
                <button
                  type="button"
                  onClick={fetchUserCases}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Try Again
                </button>
              </div>
            ) : cases.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-600">You haven't started any applications yet.</p>
                {user.role === UserRole.APPLICANT && (
                  <Link
                    href="/cases/new"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Start Your First Application
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Active Case */}
                {user.role === UserRole.APPLICANT && getActiveCase() && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Active Application</h3>
                    <CaseOverview caseData={getActiveCase()!} />
                  </div>
                )}

                {/* All Cases */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium">
                      {user.role === UserRole.APPLICANT ? 'All Applications' : 'Assigned Cases'}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Case ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Visa Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Updated
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cases.map((caseItem) => (
                          <tr key={caseItem.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {caseItem.id.substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {VISA_TYPE_LABELS[caseItem.visaType]}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(caseItem.status)}`}>
                                {caseItem.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(caseItem.updatedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href={`/cases/${caseItem.id}`}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                View
                              </Link>
                              <Link
                                href={`/documents?caseId=${caseItem.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Documents
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
