'use client';

import React, { useState, useEffect } from 'react';
import { Case } from '@/types/case';

interface CaseSortProps {
  cases: Case[];
  onSortChange: (sortedCases: Case[]) => void;
}

type SortField = 'updatedAt' | 'status' | 'priority' | 'visaType';
type SortDirection = 'asc' | 'desc';

export default function CaseSort({ cases, onSortChange }: CaseSortProps) {
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Apply sorting when sort state or cases change
  useEffect(() => {
    const sortedCases = [...cases].sort((a, b) => {
      switch (sortField) {
        case 'updatedAt':
          return sortDirection === 'asc'
            ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        
        case 'status':
          return sortDirection === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        
        case 'priority':
          // Custom priority order: premium > expedited > standard
          const priorityOrder = { premium: 3, expedited: 2, standard: 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          
          return sortDirection === 'asc'
            ? aPriority - bPriority
            : bPriority - aPriority;
        
        case 'visaType':
          return sortDirection === 'asc'
            ? a.visaType.localeCompare(b.visaType)
            : b.visaType.localeCompare(a.visaType);
        
        default:
          return 0;
      }
    });
    
    onSortChange(sortedCases);
  }, [cases, sortField, sortDirection, onSortChange]);

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-700">Sort by:</span>
      
      <div className="flex space-x-2">
        <button
          onClick={() => handleSortChange('updatedAt')}
          className={`px-3 py-1 text-sm rounded-md ${
            sortField === 'updatedAt'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Date
          {sortField === 'updatedAt' && (
            <span className="ml-1">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
        
        <button
          onClick={() => handleSortChange('status')}
          className={`px-3 py-1 text-sm rounded-md ${
            sortField === 'status'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Status
          {sortField === 'status' && (
            <span className="ml-1">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
        
        <button
          onClick={() => handleSortChange('priority')}
          className={`px-3 py-1 text-sm rounded-md ${
            sortField === 'priority'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Priority
          {sortField === 'priority' && (
            <span className="ml-1">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
        
        <button
          onClick={() => handleSortChange('visaType')}
          className={`px-3 py-1 text-sm rounded-md ${
            sortField === 'visaType'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Visa Type
          {sortField === 'visaType' && (
            <span className="ml-1">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
