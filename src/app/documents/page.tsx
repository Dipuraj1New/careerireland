'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentCategoryView from '@/components/documents/DocumentCategoryView';
import DocumentPreview from '@/components/documents/DocumentPreview';
import DocumentActionMenu from '@/components/documents/DocumentActionMenu';
import { Document, DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/document';

export default function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('caseId');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'category'>('list');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch documents for the case
  const fetchDocuments = async () => {
    if (!caseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents?caseId=${caseId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch documents on initial load and when caseId changes
  useEffect(() => {
    if (!caseId) {
      // Redirect to cases page if no caseId is provided
      router.push('/cases');
      return;
    }

    fetchDocuments();
  }, [caseId, router]);

  // Handle document upload completion
  const handleUploadComplete = () => {
    // Refresh the document list
    fetchDocuments();
  };

  // Handle document selection for preview
  const handleSelectDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowPreview(true);
  };

  // Handle document preview close
  const handleClosePreview = () => {
    setShowPreview(false);
  };

  // Handle document download
  const handleDownload = (document: Document) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = document.filePath;
    link.download = document.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle document delete
  const handleDelete = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete ${document.fileName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Refresh document list
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document. Please try again.');
    }
  };

  // Handle document rename
  const handleRename = (document: Document) => {
    const newName = prompt('Enter new file name:', document.fileName);

    if (!newName || newName === document.fileName) {
      return;
    }

    // TODO: Implement rename functionality
    alert('Rename functionality will be implemented in a future update.');
  };

  // Handle document replace
  const handleReplace = (document: Document) => {
    // TODO: Implement replace functionality
    alert('Replace functionality will be implemented in a future update.');
  };

  // Toggle view mode between list and category
  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'category' : 'list');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Document Management</h1>
          <p className="text-gray-600">
            Upload and manage your immigration documents securely.
          </p>
        </div>

        {/* View Mode Toggle */}
        {documents.length > 0 && (
          <button
            type="button"
            onClick={toggleViewMode}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {viewMode === 'list' ? (
              <>
                <svg className="h-5 w-5 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM6 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1V4zM10 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  <path d="M2 8a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V8zM6 8a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1V8zM10 8a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V8z" />
                  <path d="M2 12a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2zM6 12a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1v-2zM10 12a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z" />
                </svg>
                Category View
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                List View
              </>
            )}
          </button>
        )}
      </div>

      {/* Document Upload Component */}
      {caseId && <DocumentUpload caseId={caseId} onUploadComplete={handleUploadComplete} />}

      {/* Loading, Error, and Empty States */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading documents...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchDocuments}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Try Again
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">No documents uploaded yet.</p>
        </div>
      ) : viewMode === 'category' ? (
        // Category View
        <DocumentCategoryView
          documents={documents}
          onSelectDocument={handleSelectDocument}
        />
      ) : (
        // List View
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Your Documents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <button
                          type="button"
                          onClick={() => handleSelectDocument(document)}
                          className="text-sm font-medium text-gray-900 truncate max-w-xs hover:text-blue-600 focus:outline-none"
                        >
                          {document.fileName}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {DOCUMENT_TYPE_LABELS[document.type as DocumentType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(document.status)}`}>
                        {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(document.createdAt.toString())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleSelectDocument(document)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(document)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Download
                        </button>
                        <DocumentActionMenu
                          document={document}
                          onPreview={() => handleSelectDocument(document)}
                          onDownload={() => handleDownload(document)}
                          onDelete={() => handleDelete(document)}
                          onRename={() => handleRename(document)}
                          onReplace={() => handleReplace(document)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showPreview && selectedDocument && (
        <DocumentPreview
          document={selectedDocument}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}
