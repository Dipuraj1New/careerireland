'use client';

import React, { useState, useRef } from 'react';
import { DocumentType, DOCUMENT_TYPE_LABELS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/document';

interface DocumentUploadWithAIProps {
  caseId?: string;
  onUploadSuccess: (documentId: string) => void;
  onUploadError: (error: string) => void;
}

const DocumentUploadWithAI: React.FC<DocumentUploadWithAIProps> = ({
  caseId,
  onUploadSuccess,
  onUploadError,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }
    
    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      onUploadError(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
      return;
    }
    
    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      onUploadError(`File size exceeds the maximum allowed size (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
      return;
    }
    
    setFile(selectedFile);
  };

  // Handle document type selection
  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDocumentType(e.target.value as DocumentType);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      onUploadError('Please select a file to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      if (caseId) {
        formData.append('caseId', caseId);
      }
      
      // Upload file
      const uploadResponse = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }
      
      const uploadData = await uploadResponse.json();
      const documentId = uploadData.documentId;
      
      // Process document with AI
      setIsProcessing(true);
      
      const processResponse = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          documentType,
        }),
      });
      
      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        console.warn('Document processing failed:', errorData.error);
        // Continue even if processing fails
      }
      
      // Reset form
      setFile(null);
      setDocumentType(DocumentType.OTHER);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Call success callback
      onUploadSuccess(documentId);
    } catch (error) {
      console.error('Error uploading document:', error);
      onUploadError(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setDocumentType(DocumentType.OTHER);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h3>
      
      <div className="space-y-4">
        {/* Document Type Selection */}
        <div>
          <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
            Document Type
          </label>
          <select
            id="documentType"
            name="documentType"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={documentType}
            onChange={handleDocumentTypeChange}
            disabled={isUploading || isProcessing}
          >
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        </div>
        
        {/* File Input */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Select File
          </label>
          <div className="mt-1 flex items-center">
            <input
              id="file"
              name="file"
              type="file"
              ref={fileInputRef}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept={ALLOWED_MIME_TYPES.join(',')}
              onChange={handleFileChange}
              disabled={isUploading || isProcessing}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Allowed file types: {ALLOWED_MIME_TYPES.join(', ')}. Maximum file size: {MAX_FILE_SIZE / (1024 * 1024)}MB.
          </p>
        </div>
        
        {/* Selected File Info */}
        {file && (
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-2">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    Uploading
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div
                  style={{ width: `${uploadProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing document with AI...
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={handleReset}
            disabled={isUploading || isProcessing}
          >
            Reset
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={handleUpload}
            disabled={!file || isUploading || isProcessing}
          >
            {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : 'Upload & Process'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadWithAI;
