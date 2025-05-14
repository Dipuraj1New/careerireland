import { useState, useCallback } from 'react';
import { DocumentType, DocumentWithValidation } from '@/types/document';

interface UploadState {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error: string | null;
  document: DocumentWithValidation | null;
}

interface UseFileUploadReturn {
  uploadState: UploadState;
  uploadFile: (file: File, caseId: string, documentType: DocumentType) => Promise<void>;
  resetUpload: () => void;
  cancelUpload: () => void;
}

export default function useFileUpload(): UseFileUploadReturn {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    status: 'idle',
    error: null,
    document: null,
  });
  
  // Reference to the current XMLHttpRequest
  const [currentXhr, setCurrentXhr] = useState<XMLHttpRequest | null>(null);

  const resetUpload = useCallback(() => {
    setUploadState({
      progress: 0,
      status: 'idle',
      error: null,
      document: null,
    });
  }, []);

  const cancelUpload = useCallback(() => {
    if (currentXhr) {
      currentXhr.abort();
      setCurrentXhr(null);
    }
    
    setUploadState((prev) => ({
      ...prev,
      status: 'idle',
      error: 'Upload cancelled',
    }));
  }, [currentXhr]);

  const uploadFile = useCallback(
    async (file: File, caseId: string, documentType: DocumentType) => {
      // Reset state before starting new upload
      setUploadState({
        progress: 0,
        status: 'uploading',
        error: null,
        document: null,
      });

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', caseId);
      formData.append('documentType', documentType);

      // Create XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();
      setCurrentXhr(xhr);

      return new Promise<void>((resolve, reject) => {
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadState((prev) => ({
              ...prev,
              progress,
            }));
          }
        });

        // Handle response
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            setCurrentXhr(null);
            
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                setUploadState({
                  progress: 100,
                  status: 'success',
                  error: null,
                  document: response.document,
                });
                resolve();
              } catch (error) {
                setUploadState({
                  progress: 0,
                  status: 'error',
                  error: 'Failed to parse server response',
                  document: null,
                });
                reject(new Error('Failed to parse server response'));
              }
            } else {
              let errorMessage = 'Upload failed';
              
              try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.error || errorMessage;
              } catch (e) {
                // Use default error message if response cannot be parsed
              }
              
              setUploadState({
                progress: 0,
                status: 'error',
                error: errorMessage,
                document: null,
              });
              reject(new Error(errorMessage));
            }
          }
        };

        // Open and send request
        xhr.open('POST', '/api/documents/upload', true);
        xhr.send(formData);
      });
    },
    []
  );

  return {
    uploadState,
    uploadFile,
    resetUpload,
    cancelUpload,
  };
}
