'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Case } from '@/types/case';
import { UserRole } from '@/types/user';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CaseAssignmentProps {
  caseId: string;
  currentAgentId?: string | null;
  onAssignmentComplete?: () => void;
}

export default function CaseAssignment({ 
  caseId, 
  currentAgentId = null,
  onAssignmentComplete
}: CaseAssignmentProps) {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(currentAgentId);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch available agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/users?role=agent', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch agents');
        }
        
        const data = await response.json();
        setAgents(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAgents();
  }, []);

  const handleAssign = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          agentId: selectedAgentId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign case');
      }
      
      setSuccess('Case assigned successfully');
      
      // Call the callback if provided
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/cases/${caseId}`);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnassign = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          agentId: null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign case');
      }
      
      setSuccess('Case unassigned successfully');
      setSelectedAgentId(null);
      
      // Call the callback if provided
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/cases/${caseId}`);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">Case Assignment</h2>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="agent-select" className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Agent
            </label>
            <select
              id="agent-select"
              value={selectedAgentId || ''}
              onChange={(e) => setSelectedAgentId(e.target.value || null)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={isSaving}
            >
              <option value="">Select an agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.firstName} {agent.lastName} ({agent.email})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedAgentId || isSaving}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                !selectedAgentId || isSaving
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSaving ? 'Assigning...' : 'Assign Case'}
            </button>
            
            {currentAgentId && (
              <button
                type="button"
                onClick={handleUnassign}
                disabled={isSaving}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  isSaving
                    ? 'bg-red-300 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSaving ? 'Unassigning...' : 'Unassign Case'}
              </button>
            )}
            
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
