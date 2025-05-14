import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/document';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  onError: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  onError,
  className = '',
  disabled = false,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      // Take only the first file if multiple files are dropped
      const file = acceptedFiles[0];

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        onError(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.map(type => type.split('/')[1]).join(', ')}`);
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        onError(`File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        return;
      }

      // Pass the file to parent component
      onFileSelect(file);
    },
    [onFileSelect, onError]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    disabled,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    multiple: false,
  });

  // Handle drag state for visual feedback
  const handleDragEnter = useCallback(() => setIsDragActive(true), []);
  const handleDragLeave = useCallback(() => setIsDragActive(false), []);

  return (
    <div
      {...getRootProps({
        className: `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        } ${isDragReject ? 'border-red-500 bg-red-50' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`,
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
      })}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2">
        <svg
          className={`w-12 h-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-lg font-medium">
          {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
        </p>
        <p className="text-sm text-gray-500">
          Supported formats: PDF, JPG, PNG (Max: 10MB)
        </p>
      </div>
    </div>
  );
};

export default FileDropzone;
