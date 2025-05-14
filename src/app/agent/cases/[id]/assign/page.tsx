'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import CaseAssignment from '@/components/agent/CaseAssignment';
import { Case } from '@/types/case';
import { UserRole } from '@/types/user';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export default function CaseAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user and case data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch user data
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await userResponse.json();
        setUser(userData.user);
        
        // Redirect if not an admin (only admins can assign cases)
        if (userData.user.role !== UserRole.ADMIN) {
          router.push('/dashboard');
          return;
        }
        
        // Fetch case data
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        // Redirect to login on auth error
        if (err instanceof Error && err.message.includes('Unauthorized')) {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [caseId, router]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !user || !caseData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-600">{error || 'Case not found'}</p>
          <Link
            href="/agent/cases"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Case Queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Assign Case</h1>
          <Link
            href={`/cases/${caseId}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Case
          </Link>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Case ID: {caseId}
        </p>
      </div>
      
      <div className="space-y-6">
        <CaseAssignment 
          caseId={caseId} 
          currentAgentId={caseData.agentId || null} 
        />
      </div>
    </div>
  );
}
