import React from 'react';
import Link from 'next/link';
import { Document, DocumentType, DocumentStatus, DOCUMENT_TYPE_LABELS } from '@/types/document';
import { VisaType } from '@/types/case';

interface DocumentChecklistProps {
  caseId: string;
  visaType: VisaType;
  documents: Document[];
}

const DocumentChecklist: React.FC<DocumentChecklistProps> = ({ caseId, visaType, documents }) => {
  // Define required documents based on visa type
  const getRequiredDocuments = (type: VisaType): DocumentType[] => {
    switch (type) {
      case VisaType.STUDENT:
        return [
          DocumentType.PASSPORT,
          DocumentType.IDENTIFICATION,
          DocumentType.FINANCIAL,
          DocumentType.EDUCATIONAL,
        ];
      case VisaType.WORK:
        return [
          DocumentType.PASSPORT,
          DocumentType.IDENTIFICATION,
          DocumentType.EMPLOYMENT,
          DocumentType.FINANCIAL,
        ];
      case VisaType.FAMILY:
        return [
          DocumentType.PASSPORT,
          DocumentType.IDENTIFICATION,
          DocumentType.FINANCIAL,
          DocumentType.REFERENCE,
        ];
      case VisaType.BUSINESS:
        return [
          DocumentType.PASSPORT,
          DocumentType.IDENTIFICATION,
          DocumentType.FINANCIAL,
          DocumentType.EMPLOYMENT,
          DocumentType.REFERENCE,
        ];
      case VisaType.TOURIST:
        return [
          DocumentType.PASSPORT,
          DocumentType.IDENTIFICATION,
          DocumentType.TRAVEL,
          DocumentType.FINANCIAL,
        ];
      default:
        return [
          DocumentType.PASSPORT,
          DocumentType.IDENTIFICATION,
        ];
    }
  };

  const requiredDocuments = getRequiredDocuments(visaType);
  
  // Check if a document type is uploaded
  const getDocumentStatus = (type: DocumentType) => {
    const docs = documents.filter(doc => doc.type === type);
    
    if (docs.length === 0) {
      return {
        status: 'missing',
        statusText: 'Missing',
        statusColor: 'bg-red-100 text-red-800',
        document: null,
      };
    }
    
    // Find the most recently uploaded document of this type
    const latestDoc = docs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    switch (latestDoc.status) {
      case DocumentStatus.APPROVED:
        return {
          status: 'approved',
          statusText: 'Approved',
          statusColor: 'bg-green-100 text-green-800',
          document: latestDoc,
        };
      case DocumentStatus.REJECTED:
        return {
          status: 'rejected',
          statusText: 'Rejected',
          statusColor: 'bg-red-100 text-red-800',
          document: latestDoc,
        };
      case DocumentStatus.EXPIRED:
        return {
          status: 'expired',
          statusText: 'Expired',
          statusColor: 'bg-orange-100 text-orange-800',
          document: latestDoc,
        };
      default:
        return {
          status: 'pending',
          statusText: 'Pending Review',
          statusColor: 'bg-blue-100 text-blue-800',
          document: latestDoc,
        };
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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium">Required Documents</h2>
        <Link
          href={`/documents?caseId=${caseId}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Manage Documents
        </Link>
      </div>
      
      <div className="p-6">
        <div className="space-y-6">
          {requiredDocuments.map((docType) => {
            const { status, statusText, statusColor, document } = getDocumentStatus(docType);
            
            return (
              <div key={docType} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{DOCUMENT_TYPE_LABELS[docType]}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {status === 'missing' 
                        ? 'This document is required for your application.' 
                        : `Uploaded on ${formatDate(document?.createdAt)}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                    {statusText}
                  </span>
                </div>
                
                {status === 'missing' ? (
                  <div className="mt-4">
                    <Link
                      href={`/documents/upload?caseId=${caseId}&type=${docType}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Upload Document
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center space-x-4">
                    <Link
                      href={`/documents/${document?.id}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-500"
                    >
                      View Document
                    </Link>
                    
                    {(status === 'rejected' || status === 'expired') && (
                      <Link
                        href={`/documents/upload?caseId=${caseId}&type=${docType}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-500"
                      >
                        Upload New Version
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900">Additional Documents</h3>
          <p className="mt-1 text-xs text-gray-500">
            You may need to provide additional documents based on your specific circumstances.
          </p>
          <div className="mt-4">
            <Link
              href={`/documents/upload?caseId=${caseId}`}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upload Additional Document
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentChecklist;
