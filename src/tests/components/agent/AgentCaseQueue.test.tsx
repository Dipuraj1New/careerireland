import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentCaseQueue from '@/components/agent/AgentCaseQueue';
import { Case, CaseStatus, CasePriority, VisaType } from '@/types/case';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AgentCaseQueue Component', () => {
  const mockCases: Case[] = [
    {
      id: '1234abcd-5678-efgh-ijkl-mnopqrstuvwx',
      applicantId: 'applicant1',
      agentId: 'agent1',
      visaType: VisaType.STUDENT,
      status: CaseStatus.SUBMITTED,
      priority: CasePriority.STANDARD,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
    },
    {
      id: '5678efgh-1234-abcd-ijkl-mnopqrstuvwx',
      applicantId: 'applicant2',
      agentId: 'agent1',
      visaType: VisaType.WORK,
      status: CaseStatus.IN_REVIEW,
      priority: CasePriority.EXPEDITED,
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-04'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ cases: mockCases }),
    });
  });

  it('renders loading state initially', () => {
    render(<AgentCaseQueue loading={true} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to fetch cases' }),
    });

    render(<AgentCaseQueue />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch cases/i)).toBeInTheDocument();
    });
  });

  it('renders cases when provided as props', () => {
    render(<AgentCaseQueue initialCases={mockCases} />);
    
    expect(screen.getByText(/1234abcd/i)).toBeInTheDocument();
    expect(screen.getByText(/student visa/i, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/submitted/i, { exact: false })).toBeInTheDocument();
    
    expect(screen.getByText(/5678efgh/i)).toBeInTheDocument();
    expect(screen.getByText(/work visa/i, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/in review/i, { exact: false })).toBeInTheDocument();
  });

  it('fetches cases when not provided as props', async () => {
    render(<AgentCaseQueue />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/cases', expect.any(Object));
      expect(screen.getByText(/1234abcd/i)).toBeInTheDocument();
      expect(screen.getByText(/5678efgh/i)).toBeInTheDocument();
    });
  });

  it('allows filtering cases', async () => {
    render(<AgentCaseQueue initialCases={mockCases} />);
    
    // Open filters
    fireEvent.click(screen.getByText(/show filters/i));
    
    // Filter by status
    const statusFilter = screen.getByLabelText(/status/i);
    fireEvent.change(statusFilter, { target: { value: CaseStatus.IN_REVIEW } });
    
    // Only the IN_REVIEW case should be visible
    await waitFor(() => {
      expect(screen.queryByText(/1234abcd/i)).not.toBeInTheDocument();
      expect(screen.getByText(/5678efgh/i)).toBeInTheDocument();
    });
  });

  it('allows sorting cases', async () => {
    render(<AgentCaseQueue initialCases={mockCases} />);
    
    // Sort by visa type
    fireEvent.click(screen.getByText(/visa type/i));
    
    // Check order after sorting
    const rows = screen.getAllByRole('row').slice(1); // Skip header row
    
    await waitFor(() => {
      // Student visa should come after Work visa in descending order
      expect(rows[0].textContent).toContain('Work');
      expect(rows[1].textContent).toContain('Student');
    });
    
    // Toggle sort direction
    fireEvent.click(screen.getByText(/visa type/i));
    
    await waitFor(() => {
      const rowsAfterToggle = screen.getAllByRole('row').slice(1);
      // Student visa should come before Work visa in ascending order
      expect(rowsAfterToggle[0].textContent).toContain('Student');
      expect(rowsAfterToggle[1].textContent).toContain('Work');
    });
  });

  it('shows empty state when no cases match filters', async () => {
    render(<AgentCaseQueue initialCases={mockCases} />);
    
    // Open filters
    fireEvent.click(screen.getByText(/show filters/i));
    
    // Filter by a status that doesn't exist in our mock data
    const statusFilter = screen.getByLabelText(/status/i);
    fireEvent.change(statusFilter, { target: { value: CaseStatus.APPROVED } });
    
    await waitFor(() => {
      expect(screen.getByText(/no cases found/i)).toBeInTheDocument();
    });
  });
});
