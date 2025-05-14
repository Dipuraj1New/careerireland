'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import CaseDetailView from '@/components/agent/CaseDetailView';
import { CaseStatus, CasePriority } from '@/types/case';
import { DocumentStatus } from '@/types/document';

interface CaseDetailPageProps {
  params: {
    id: string;
  };
}

export default function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/login');
    }
    
    const fetchCaseData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch case data
        const caseResponse = await fetch(`/api/cases/${params.id}`);
        
        if (!caseResponse.ok) {
          throw new Error('Failed to fetch case data');
        }
        
        const caseData = await caseResponse.json();
        setCaseData(caseData.case);
        
        // Fetch documents
        const documentsResponse = await fetch(`/api/documents?caseId=${params.id}`);
        
        if (!documentsResponse.ok) {
          throw new Error('Failed to fetch documents');
        }
        
        const documentsData = await documentsResponse.json();
        setDocuments(documentsData.documents);
        
        // Fetch timeline
        const timelineResponse = await fetch(`/api/cases/${params.id}/timeline`);
        
        if (!timelineResponse.ok) {
          throw new Error('Failed to fetch timeline');
        }
        
        const timelineData = await timelineResponse.json();
        setTimeline(timelineData.events);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching case data:', error);
        setError('Failed to load case data. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchCaseData();
  }, [session, status, params.id]);
  
  const handleStatusChange = async (newStatus: CaseStatus) => {
    try {
      const response = await fetch(`/api/cases/${params.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update case status');
      }
      
      const data = await response.json();
      setCaseData(data.case);
      
      // Refresh timeline
      const timelineResponse = await fetch(`/api/cases/${params.id}/timeline`);
      const timelineData = await timelineResponse.json();
      setTimeline(timelineData.events);
      
      return data.case;
    } catch (error) {
      console.error('Error updating case status:', error);
      throw error;
    }
  };
  
  const handlePriorityChange = async (newPriority: CasePriority) => {
    try {
      const response = await fetch(`/api/cases/${params.id}/priority`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority: newPriority }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update case priority');
      }
      
      const data = await response.json();
      setCaseData(data.case);
      
      // Refresh timeline
      const timelineResponse = await fetch(`/api/cases/${params.id}/timeline`);
      const timelineData = await timelineResponse.json();
      setTimeline(timelineData.events);
      
      return data.case;
    } catch (error) {
      console.error('Error updating case priority:', error);
      throw error;
    }
  };
  
  const handleDocumentStatusChange = async (documentId: string, newStatus: DocumentStatus) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update document status');
      }
      
      const data = await response.json();
      
      // Update documents list
      setDocuments(documents.map(doc => 
        doc.id === documentId ? data.document : doc
      ));
      
      // Refresh timeline
      const timelineResponse = await fetch(`/api/cases/${params.id}/timeline`);
      const timelineData = await timelineResponse.json();
      setTimeline(timelineData.events);
      
      return data.document;
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }
  
  if (!caseData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not Found: </strong>
          <span className="block sm:inline">The requested case could not be found.</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <CaseDetailView
        caseData={caseData}
        documents={documents}
        timeline={timeline}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onDocumentStatusChange={handleDocumentStatusChange}
      />
    </div>
  );
}
