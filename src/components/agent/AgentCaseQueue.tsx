'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Case, CaseStatus, CasePriority, CASE_STATUS_LABELS, VISA_TYPE_LABELS } from '@/types/case';
import { formatDistanceToNow } from 'date-fns';
import CaseFilter from './CaseFilter';
import CaseSort from './CaseSort';

interface AgentCaseQueueProps {
  initialCases?: Case[];
  loading?: boolean;
}

export default function AgentCaseQueue({ initialCases = [], loading = false }: AgentCaseQueueProps) {
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [filteredCases, setFilteredCases] = useState<Case[]>(initialCases);
  const [isLoading, setIsLoading] = useState(loading);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const casesPerPage = 10;

  // Fetch cases if not provided
  useEffect(() => {
    if (initialCases.length === 0 && !loading) {
      fetchCases();
    }
  }, [initialCases, loading]);

  // Update filtered cases when cases change
  useEffect(() => {
    setFilteredCases(cases);
  }, [cases]);

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/cases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }
      
      const data = await response.json();
      setCases(data.cases || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filteredCases: Case[]) => {
    setFilteredCases(filteredCases);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle sort changes
  const handleSortChange = (sortedCases: Case[]) => {
    setFilteredCases(sortedCases);
  };

  // Calculate pagination
  const indexOfLastCase = currentPage * casesPerPage;
  const indexOfFirstCase = indexOfLastCase - casesPerPage;
  const currentCases = filteredCases.slice(indexOfFirstCase, indexOfLastCase);
  const totalPages = Math.ceil(filteredCases.length / casesPerPage);

  // Get status color based on case status
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
  const getPriorityColor = (priority: CasePriority) => {
    switch (priority) {
      case CasePriority.STANDARD:
        return 'bg-gray-100 text-gray-800';
      case CasePriority.EXPEDITED:
        return 'bg-orange-100 text-orange-800';
      case CasePriority.PREMIUM:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchCases}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">Case Queue</h2>
      </div>
      
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <CaseFilter cases={cases} onFilterChange={handleFilterChange} />
          <CaseSort cases={filteredCases} onSortChange={handleSortChange} />
        </div>
      </div>
      
      {currentCases.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No cases found. Adjust your filters or check back later.
        </div>
      ) : (
        <>
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
                    Priority
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
                {currentCases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {caseItem.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {VISA_TYPE_LABELS[caseItem.visaType]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(caseItem.status)}`}>
                        {CASE_STATUS_LABELS[caseItem.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(caseItem.priority)}`}>
                        {caseItem.priority.charAt(0).toUpperCase() + caseItem.priority.slice(1)}
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
                        href={`/agent/cases/${caseItem.id}/assign`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Assign
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
