'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Document, DocumentStatus, DocumentType, DOCUMENT_TYPE_LABELS, AIProcessingResults } from '@/types/document';
import DocumentProcessingResult from '@/components/documents/DocumentProcessingResult';

interface DocumentVerificationViewProps {
  documentId: string;
}

export default function DocumentVerificationView({ documentId }: DocumentVerificationViewProps) {
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [aiResults, setAiResults] = useState<AIProcessingResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Fetch document data
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/documents/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }
        
        const data = await response.json();
        setDocument(data.document);
        
        // If document has AI processing results, set them
        if (data.document.aiProcessingResults) {
          setAiResults(data.document.aiProcessingResults);
        }
        
        // Get document image URL
        if (data.document.filePath) {
          const urlResponse = await fetch(`/api/documents/${documentId}/url`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          
          if (urlResponse.ok) {
            const urlData = await urlResponse.json();
            setImageUrl(urlData.url);
          }
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocument();
  }, [documentId]);

  // Handle document verification
  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      
      const response = await fetch(`/api/documents/${documentId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          status: DocumentStatus.VERIFIED,
          notes: verificationNotes,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify document');
      }
      
      // Redirect back to case
      if (document?.caseId) {
        router.push(`/cases/${document.caseId}`);
      } else {
        router.push('/agent/cases');
      }
    } catch (err) {
      console.error('Error verifying document:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle document rejection
  const handleReject = async () => {
    try {
      setIsRejecting(true);
      
      const response = await fetch(`/api/documents/${documentId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          status: DocumentStatus.REJECTED,
          notes: verificationNotes,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject document');
      }
      
      // Redirect back to case
      if (document?.caseId) {
        router.push(`/cases/${document.caseId}`);
      } else {
        router.push('/agent/cases');
      }
    } catch (err) {
      console.error('Error rejecting document:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRejecting(false);
    }
  };

  // Handle AI processing
  const handleProcessWithAI = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/documents/${documentId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          forceReprocess: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process document with AI');
      }
      
      const data = await response.json();
      setAiResults(data.results);
      
      // Update document with new AI results
      if (document) {
        setDocument({
          ...document,
          aiProcessingResults: data.results,
        });
      }
    } catch (err) {
      console.error('Error processing document with AI:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-sm text-gray-500 mb-4">{error || 'Document not found'}</p>
          <Link
            href="/agent/cases"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Cases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Header */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium">Document Verification</h2>
            <p className="text-sm text-gray-500">
              {DOCUMENT_TYPE_LABELS[document.type]} - {document.filename}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            document.status === DocumentStatus.VERIFIED 
              ? 'bg-green-100 text-green-800' 
              : document.status === DocumentStatus.REJECTED
              ? 'bg-red-100 text-red-800'
              : document.status === DocumentStatus.PROCESSING
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {document.status}
          </span>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Document Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Document ID</p>
                  <p className="text-sm font-medium">{document.id}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm font-medium">{DOCUMENT_TYPE_LABELS[document.type]}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Uploaded By</p>
                  <p className="text-sm font-medium">{document.uploadedBy || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Upload Date</p>
                  <p className="text-sm font-medium">{formatDate(document.createdAt)}</p>
                </div>
                
                {document.validUntil && (
                  <div>
                    <p className="text-xs text-gray-500">Valid Until</p>
                    <p className="text-sm font-medium">{formatDate(document.validUntil)}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Document Preview</h3>
              {imageUrl ? (
                <div className="relative h-48 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={document.filename}
                    className="object-contain w-full h-full cursor-pointer"
                    onClick={() => setShowImagePreview(true)}
                  />
                  <div className="absolute bottom-2 right-2">
                    <button
                      type="button"
                      onClick={() => setShowImagePreview(true)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-gray-600 hover:bg-gray-700"
                    >
                      Expand
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gray-100 rounded-md flex items-center justify-center">
                  <p className="text-sm text-gray-500">No preview available</p>
                </div>
              )}
              
              <div className="mt-4 flex space-x-2">
                <a
                  href={imageUrl || '#'}
                  download={document.filename}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
                
                <button
                  type="button"
                  onClick={handleProcessWithAI}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Process with AI
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Processing Results */}
      {aiResults && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">AI Processing Results</h2>
          </div>
          <div className="p-6">
            <DocumentProcessingResult results={aiResults} />
          </div>
        </div>
      )}
      
      {/* Verification Form */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Verification Decision</h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="verification-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Notes
            </label>
            <textarea
              id="verification-notes"
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Add notes about this document verification..."
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              disabled={isVerifying || isRejecting}
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link
              href={document.caseId ? `/cases/${document.caseId}` : '/agent/cases'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            
            <button
              type="button"
              onClick={handleReject}
              disabled={isVerifying || isRejecting || !verificationNotes.trim()}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isVerifying || isRejecting || !verificationNotes.trim()
                  ? 'bg-red-300 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isRejecting ? 'Rejecting...' : 'Reject Document'}
            </button>
            
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || isRejecting || !verificationNotes.trim()}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isVerifying || isRejecting || !verificationNotes.trim()
                  ? 'bg-green-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isVerifying ? 'Verifying...' : 'Verify Document'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Image Preview Modal */}
      {showImagePreview && imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowImagePreview(false)}>
          <div className="max-w-4xl max-h-screen p-4">
            <img
              src={imageUrl}
              alt={document.filename}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
