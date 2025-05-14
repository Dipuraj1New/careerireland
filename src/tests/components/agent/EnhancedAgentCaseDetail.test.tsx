import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnhancedAgentCaseDetail from '@/components/agent/EnhancedAgentCaseDetail';
import { Case, CaseStatus, CasePriority, VisaType } from '@/types/case';
import { AuditLog, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';
import { DocumentStatus, DocumentType } from '@/types/document';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock the Tab component from @headlessui/react
jest.mock('@headlessui/react', () => ({
  Tab: {
    Group: ({ children }: any) => <div>{children}</div>,
    List: ({ children }: any) => <div>{children}</div>,
    Panels: ({ children }: any) => <div>{children}</div>,
    Panel: ({ children }: any) => <div>{children}</div>,
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('EnhancedAgentCaseDetail', () => {
  // Mock data
  const mockCase: Case & { documents: any[] } = {
    id: 'case123',
    userId: 'user123',
    visaType: VisaType.STUDENT,
    status: CaseStatus.IN_REVIEW,
    priority: CasePriority.STANDARD,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    submissionDate: new Date('2023-01-01'),
    agentId: 'agent123',
    documents: [
      {
        id: 'doc123',
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
      },
    ],
  };

  const mockHistory: AuditLog[] = [
    {
      id: 'log123',
      entityId: 'case123',
      entityType: 'case',
      action: AuditAction.STATUS_CHANGE,
      userId: 'user123',
      userRole: UserRole.APPLICANT,
      timestamp: new Date('2023-01-01'),
      details: {
        oldStatus: CaseStatus.SUBMITTED,
        newStatus: CaseStatus.IN_REVIEW,
        notes: 'Case is now under review',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ notes: 'Test case notes' }),
    });
  });

  it('renders the component correctly', async () => {
    render(
      <EnhancedAgentCaseDetail
        caseData={mockCase}
        caseHistory={mockHistory}
        userRole={UserRole.AGENT}
      />
    );

    // Check if the component renders
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();

    // Check if case overview is rendered
    expect(screen.getByText('Agent Actions')).toBeInTheDocument();
    
    // Check if status update buttons are rendered
    expect(screen.getByText('Additional Info Required')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('opens status update modal when clicking on status button', async () => {
    render(
      <EnhancedAgentCaseDetail
        caseData={mockCase}
        caseHistory={mockHistory}
        userRole={UserRole.AGENT}
      />
    );

    // Click on a status button
    fireEvent.click(screen.getByText('Approved'));

    // Check if modal is opened
    expect(screen.getByText('Update Status to Approved')).toBeInTheDocument();
    expect(screen.getByText('Notes (required)')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Update Status')).toBeInTheDocument();
  });

  it('submits status update when form is filled', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(
      <EnhancedAgentCaseDetail
        caseData={mockCase}
        caseHistory={mockHistory}
        userRole={UserRole.AGENT}
      />
    );

    // Click on a status button
    fireEvent.click(screen.getByText('Approved'));

    // Fill the form
    fireEvent.change(screen.getByPlaceholderText('Add notes about this status change...'), {
      target: { value: 'Approving this case' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Update Status'));

    // Check if fetch was called with correct parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/cases/${mockCase.id}/status`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            status: CaseStatus.APPROVED,
            notes: 'Approving this case',
          }),
        })
      );
    });
  });

  it('saves case notes when save button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(
      <EnhancedAgentCaseDetail
        caseData={mockCase}
        caseHistory={mockHistory}
        userRole={UserRole.AGENT}
      />
    );

    // Find the Notes tab and click it
    const notesTab = screen.getByText('Notes');
    fireEvent.click(notesTab);

    // Find the textarea and change its value
    const textarea = screen.getByPlaceholderText('Add notes about this case...');
    fireEvent.change(textarea, { target: { value: 'Updated case notes' } });

    // Click the save button
    fireEvent.click(screen.getByText('Save Notes'));

    // Check if fetch was called with correct parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/cases/${mockCase.id}/notes`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            notes: 'Updated case notes',
          }),
        })
      );
    });
  });
});
