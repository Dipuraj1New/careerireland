import React, { useState, useCallback } from 'react';
import { DocumentType } from '@/types/document';
import FileDropzone from './FileDropzone';
import UploadProgress from './UploadProgress';
import DocumentTypeSelector from './DocumentTypeSelector';
import useFileUpload from '@/hooks/useFileUpload';

interface DocumentUploadProps {
  caseId: string;
  onUploadComplete?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ caseId, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [dropzoneError, setDropzoneError] = useState<string | null>(null);
  
  const { uploadState, uploadFile, resetUpload, cancelUpload } = useFileUpload();
  
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setDropzoneError(null);
  }, []);
  
  const handleDropzoneError = useCallback((error: string) => {
    setDropzoneError(error);
    setSelectedFile(null);
  }, []);
  
  const handleDocumentTypeChange = useCallback((type: DocumentType) => {
    setDocumentType(type);
  }, []);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !documentType) {
      return;
    }
    
    try {
      await uploadFile(selectedFile, caseId, documentType);
      
      // Reset form after successful upload
      setSelectedFile(null);
      setDocumentType('');
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      // Error is handled in the useFileUpload hook
      console.error('Upload error:', error);
    }
  }, [selectedFile, documentType, caseId, uploadFile, onUploadComplete]);
  
  const handleRetry = useCallback(() => {
    resetUpload();
    // Keep the same file and document type for retry
  }, [resetUpload]);
  
  const isUploading = uploadState.status === 'uploading';
  const hasError = uploadState.status === 'error' || !!dropzoneError;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-medium mb-4">Upload Document</h2>
      
      {uploadState.status === 'success' ? (
        <div className="mb-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Upload Successful</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your document has been uploaded successfully.
                </p>
                <button
                  type="button"
                  onClick={resetUpload}
                  className="mt-2 text-sm font-medium text-green-700 hover:text-green-600"
                >
                  Upload Another Document
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Show progress during upload */}
          {(isUploading || uploadState.status === 'error') && selectedFile && (
            <UploadProgress
              progress={uploadState.progress}
              fileName={selectedFile.name}
              fileSize={selectedFile.size}
              status={uploadState.status === 'error' ? 'error' : 'uploading'}
              onCancel={isUploading ? cancelUpload : undefined}
              onRetry={uploadState.status === 'error' ? handleRetry : undefined}
              error={uploadState.error || undefined}
            />
          )}
          
          {/* Document Type Selector */}
          <DocumentTypeSelector
            selectedType={documentType}
            onChange={handleDocumentTypeChange}
            disabled={isUploading}
          />
          
          {/* File Dropzone */}
          <FileDropzone
            onFileSelect={handleFileSelect}
            onError={handleDropzoneError}
            disabled={isUploading}
            className="mb-4"
          />
          
          {/* Dropzone Error */}
          {dropzoneError && (
            <div className="text-sm text-red-600 mb-4">{dropzoneError}</div>
          )}
          
          {/* Selected File Info */}
          {selectedFile && !isUploading && uploadState.status !== 'error' && (
            <div className="flex items-center p-3 bg-gray-50 rounded-md mb-4">
              <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="ml-auto text-gray-400 hover:text-gray-600"
                aria-label="Remove file"
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!selectedFile || !documentType || isUploading}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                !selectedFile || !documentType || isUploading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DocumentUpload;
