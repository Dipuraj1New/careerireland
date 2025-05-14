'use client';

import React, { useState, useEffect } from 'react';
import { Case, CaseStatus, VisaType, CasePriority, CASE_STATUS_LABELS, VISA_TYPE_LABELS } from '@/types/case';

interface CaseFilterProps {
  cases: Case[];
  onFilterChange: (filteredCases: Case[]) => void;
}

export default function CaseFilter({ cases, onFilterChange }: CaseFilterProps) {
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [visaTypeFilter, setVisaTypeFilter] = useState<VisaType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<CasePriority | 'all'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters when filter state or cases change
  useEffect(() => {
    const filteredCases = cases.filter((caseItem) => {
      // Status filter
      if (statusFilter !== 'all' && caseItem.status !== statusFilter) {
        return false;
      }
      
      // Visa type filter
      if (visaTypeFilter !== 'all' && caseItem.visaType !== visaTypeFilter) {
        return false;
      }
      
      // Priority filter
      if (priorityFilter !== 'all' && caseItem.priority !== priorityFilter) {
        return false;
      }
      
      // Date range filter
      if (dateRangeFilter !== 'all') {
        const now = new Date();
        const caseDate = new Date(caseItem.updatedAt);
        const daysDiff = Math.floor((now.getTime() - caseDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateRangeFilter === '7days' && daysDiff > 7) {
          return false;
        } else if (dateRangeFilter === '30days' && daysDiff > 30) {
          return false;
        } else if (dateRangeFilter === '90days' && daysDiff > 90) {
          return false;
        }
      }
      
      return true;
    });
    
    onFilterChange(filteredCases);
  }, [cases, statusFilter, visaTypeFilter, priorityFilter, dateRangeFilter, onFilterChange]);

  const resetFilters = () => {
    setStatusFilter('all');
    setVisaTypeFilter('all');
    setPriorityFilter('all');
    setDateRangeFilter('all');
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-sm text-gray-700 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        
        {showFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Reset Filters
          </button>
        )}
      </div>
      
      {showFilters && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CaseStatus | 'all')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Statuses</option>
              {Object.values(CaseStatus).map((status) => (
                <option key={status} value={status}>
                  {CASE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          
          {/* Visa Type Filter */}
          <div>
            <label htmlFor="visa-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Visa Type
            </label>
            <select
              id="visa-type-filter"
              value={visaTypeFilter}
              onChange={(e) => setVisaTypeFilter(e.target.value as VisaType | 'all')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Visa Types</option>
              {Object.values(VisaType).map((type) => (
                <option key={type} value={type}>
                  {VISA_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          
          {/* Priority Filter */}
          <div>
            <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as CasePriority | 'all')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Priorities</option>
              {Object.values(CasePriority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date Range Filter */}
          <div>
            <label htmlFor="date-range-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Updated Within
            </label>
            <select
              id="date-range-filter"
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as 'all' | '7days' | '30days' | '90days')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">Any Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
