import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileDropzone from '@/components/documents/FileDropzone';

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({
      onClick: jest.fn(),
      onDragEnter: jest.fn(),
      onDragLeave: jest.fn(),
    }),
    getInputProps: () => ({}),
    isDragReject: false,
  }),
}));

describe('FileDropzone Component', () => {
  const mockOnFileSelect = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <FileDropzone onFileSelect={mockOnFileSelect} onError={mockOnError} />
    );

    expect(screen.getByText(/Drag & drop a file here/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported formats/i)).toBeInTheDocument();
  });

  it('shows correct text when disabled', () => {
    render(
      <FileDropzone onFileSelect={mockOnFileSelect} onError={mockOnError} disabled={true} />
    );

    const dropzoneElement = screen.getByText(/Drag & drop a file here/i).closest('div');
    expect(dropzoneElement).toHaveClass('opacity-50');
    expect(dropzoneElement).toHaveClass('cursor-not-allowed');
  });

  it('applies custom className', () => {
    render(
      <FileDropzone 
        onFileSelect={mockOnFileSelect} 
        onError={mockOnError} 
        className="custom-class"
      />
    );

    const dropzoneElement = screen.getByText(/Drag & drop a file here/i).closest('div');
    expect(dropzoneElement).toHaveClass('custom-class');
  });
});
