import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DocumentVerificationView from '@/components/agent/DocumentVerificationView';
import { DocumentStatus, DocumentType } from '@/types/document';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('DocumentVerificationView', () => {
  const mockDocumentId = 'doc123';
  
  const mockDocument = {
    id: mockDocumentId,
    caseId: 'case123',
    userId: 'user123',
    type: DocumentType.PASSPORT,
    status: DocumentStatus.UPLOADED,
    filename: 'passport.pdf',
    filePath: '/documents/passport.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };
  
  const mockAiResults = {
    documentType: DocumentType.PASSPORT,
    confidence: 95,
    extractedData: {
      passportNumber: 'AB123456',
      surname: 'Smith',
      givenNames: 'John',
      dateOfBirth: '1990-01-01',
    },
    dataConfidence: {
      passportNumber: 90,
      surname: 95,
      givenNames: 95,
      dateOfBirth: 85,
    },
    validationResult: {
      isValid: true,
      score: 90,
      errors: [],
      warnings: [],
    },
    processingTime: 1500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful document fetch
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes(`/api/documents/${mockDocumentId}`)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ document: mockDocument }),
        });
      }
      
      if (url.includes(`/api/documents/${mockDocumentId}/url`)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ url: 'https://example.com/document.pdf' }),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders loading state initially', () => {
    render(<DocumentVerificationView documentId={mockDocumentId} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders document details after loading', async () => {
    render(<DocumentVerificationView documentId={mockDocumentId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Document Verification')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Document Details')).toBeInTheDocument();
    expect(screen.getByText('Document Preview')).toBeInTheDocument();
    expect(screen.getByText('Verification Decision')).toBeInTheDocument();
    
    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('UPLOADED')).toBeInTheDocument();
  });

  it('processes document with AI when button is clicked', async () => {
    // Mock AI processing response
    (global.fetch as jest.Mock).mockImplementationOnce((url, options) => {
      if (url.includes('/api/documents/doc123/process') && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: mockAiResults }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
    render(<DocumentVerificationView documentId={mockDocumentId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Process with AI')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Process with AI'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/documents/${mockDocumentId}/process`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            forceReprocess: true,
          }),
        })
      );
    });
  });

  it('verifies document when verify button is clicked', async () => {
    // Mock verification response
    (global.fetch as jest.Mock).mockImplementationOnce((url, options) => {
      if (url.includes('/api/documents/doc123/verify') && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
    render(<DocumentVerificationView documentId={mockDocumentId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Verify Document')).toBeInTheDocument();
    });
    
    // Enter verification notes
    fireEvent.change(screen.getByPlaceholderText('Add notes about this document verification...'), {
      target: { value: 'Document looks valid' },
    });
    
    // Click verify button
    fireEvent.click(screen.getByText('Verify Document'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/documents/${mockDocumentId}/verify`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            status: DocumentStatus.VERIFIED,
            notes: 'Document looks valid',
          }),
        })
      );
    });
  });

  it('rejects document when reject button is clicked', async () => {
    // Mock rejection response
    (global.fetch as jest.Mock).mockImplementationOnce((url, options) => {
      if (url.includes('/api/documents/doc123/verify') && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
    render(<DocumentVerificationView documentId={mockDocumentId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Reject Document')).toBeInTheDocument();
    });
    
    // Enter verification notes
    fireEvent.change(screen.getByPlaceholderText('Add notes about this document verification...'), {
      target: { value: 'Document is invalid' },
    });
    
    // Click reject button
    fireEvent.click(screen.getByText('Reject Document'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/documents/${mockDocumentId}/verify`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            status: DocumentStatus.REJECTED,
            notes: 'Document is invalid',
          }),
        })
      );
    });
  });

  it('handles errors when document fetch fails', async () => {
    // Mock failed document fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() => {
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Document not found' }),
      });
    });
    
    render(<DocumentVerificationView documentId={mockDocumentId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Document not found')).toBeInTheDocument();
    expect(screen.getByText('Back to Cases')).toBeInTheDocument();
  });
});
