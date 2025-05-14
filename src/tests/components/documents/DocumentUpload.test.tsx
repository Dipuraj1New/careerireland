import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentUpload from '@/components/documents/DocumentUpload';
import useFileUpload from '@/hooks/useFileUpload';

// Mock the useFileUpload hook
jest.mock('@/hooks/useFileUpload');

// Mock the child components
jest.mock('@/components/documents/FileDropzone', () => {
  return function MockFileDropzone({ onFileSelect }: { onFileSelect: (file: File) => void }) {
    return (
      <div data-testid="file-dropzone">
        <button 
          onClick={() => onFileSelect(new File(['test'], 'test.pdf', { type: 'application/pdf' }))}
        >
          Select File
        </button>
      </div>
    );
  };
});

jest.mock('@/components/documents/DocumentTypeSelector', () => {
  return function MockDocumentTypeSelector({ onChange }: { onChange: (type: string) => void }) {
    return (
      <div data-testid="document-type-selector">
        <select 
          data-testid="document-type-select"
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select type</option>
          <option value="passport">Passport</option>
          <option value="visa">Visa</option>
        </select>
      </div>
    );
  };
});

jest.mock('@/components/documents/UploadProgress', () => {
  return function MockUploadProgress() {
    return <div data-testid="upload-progress"></div>;
  };
});

describe('DocumentUpload Component', () => {
  const mockCaseId = '123456';
  const mockOnUploadComplete = jest.fn();
  
  // Mock implementation of useFileUpload
  const mockUploadFile = jest.fn();
  const mockResetUpload = jest.fn();
  const mockCancelUpload = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (useFileUpload as jest.Mock).mockReturnValue({
      uploadState: {
        progress: 0,
        status: 'idle',
        error: null,
        document: null,
      },
      uploadFile: mockUploadFile,
      resetUpload: mockResetUpload,
      cancelUpload: mockCancelUpload,
    });
  });

  it('renders correctly in initial state', () => {
    render(<DocumentUpload caseId={mockCaseId} onUploadComplete={mockOnUploadComplete} />);
    
    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(screen.getByTestId('file-dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('document-type-selector')).toBeInTheDocument();
    expect(screen.getByText('Upload Document')).toBeDisabled();
  });

  it('enables submit button when file is selected and document type is chosen', async () => {
    render(<DocumentUpload caseId={mockCaseId} onUploadComplete={mockOnUploadComplete} />);
    
    // Select a file
    fireEvent.click(screen.getByText('Select File'));
    
    // Select a document type
    fireEvent.change(screen.getByTestId('document-type-select'), { target: { value: 'passport' } });
    
    // Submit button should be enabled
    await waitFor(() => {
      expect(screen.getByText('Upload Document')).not.toBeDisabled();
    });
  });

  it('calls uploadFile when form is submitted', async () => {
    render(<DocumentUpload caseId={mockCaseId} onUploadComplete={mockOnUploadComplete} />);
    
    // Select a file
    fireEvent.click(screen.getByText('Select File'));
    
    // Select a document type
    fireEvent.change(screen.getByTestId('document-type-select'), { target: { value: 'passport' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Upload Document'));
    
    // Check if uploadFile was called with correct parameters
    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalledWith(
        expect.any(File),
        mockCaseId,
        'passport'
      );
    });
  });

  it('shows success message after successful upload', async () => {
    // Mock successful upload
    (useFileUpload as jest.Mock).mockReturnValue({
      uploadState: {
        progress: 100,
        status: 'success',
        error: null,
        document: { id: '123', fileName: 'test.pdf' },
      },
      uploadFile: mockUploadFile,
      resetUpload: mockResetUpload,
      cancelUpload: mockCancelUpload,
    });
    
    render(<DocumentUpload caseId={mockCaseId} onUploadComplete={mockOnUploadComplete} />);
    
    expect(screen.getByText('Upload Successful')).toBeInTheDocument();
    expect(screen.getByText('Upload Another Document')).toBeInTheDocument();
  });

  it('shows progress indicator during upload', async () => {
    // Mock upload in progress
    (useFileUpload as jest.Mock).mockReturnValue({
      uploadState: {
        progress: 50,
        status: 'uploading',
        error: null,
        document: null,
      },
      uploadFile: mockUploadFile,
      resetUpload: mockResetUpload,
      cancelUpload: mockCancelUpload,
    });
    
    render(<DocumentUpload caseId={mockCaseId} onUploadComplete={mockOnUploadComplete} />);
    
    // Select a file to show progress
    fireEvent.click(screen.getByText('Select File'));
    
    expect(screen.getByTestId('upload-progress')).toBeInTheDocument();
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });
});
