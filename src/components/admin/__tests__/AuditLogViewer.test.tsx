import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuditLogViewer from '../AuditLogViewer';
import { AuditAction, AuditEntityType } from '@/types/audit';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AuditLogViewer', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Setup search params mock
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (param: string) => mockSearchParams.get(param),
    });
    
    // Setup fetch mock
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: '1',
            userId: 'user-1',
            entityType: AuditEntityType.USER,
            entityId: 'entity-1',
            action: AuditAction.CREATE,
            details: {},
            ipAddress: '127.0.0.1',
            userAgent: 'Test Agent',
            timestamp: new Date().toISOString(),
          },
          {
            id: '2',
            userId: 'user-2',
            entityType: AuditEntityType.DOCUMENT,
            entityId: 'entity-2',
            action: AuditAction.VIEW,
            details: {},
            ipAddress: '127.0.0.2',
            userAgent: 'Test Agent 2',
            timestamp: new Date().toISOString(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 2,
          totalPages: 1,
        },
      }),
    });
  });
  
  it('renders the component correctly', async () => {
    render(<AuditLogViewer />);
    
    // Check title and description
    expect(screen.getByText('Audit Log Viewer')).toBeInTheDocument();
    expect(screen.getByText('View and search system audit logs for security and compliance monitoring')).toBeInTheDocument();
    
    // Check filter controls
    expect(screen.getByText('Entity Type')).toBeInTheDocument();
    expect(screen.getByText('Entity ID')).toBeInTheDocument();
    expect(screen.getByText('User ID')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
    
    // Check table headers
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('User ID')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Entity Type')).toBeInTheDocument();
    expect(screen.getByText('Entity ID')).toBeInTheDocument();
    expect(screen.getByText('IP Address')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
  
  it('applies filters correctly', async () => {
    render(<AuditLogViewer />);
    
    // Wait for initial data load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Set entity type filter
    const entityTypeSelect = screen.getByText('All entity types');
    fireEvent.click(entityTypeSelect);
    
    // Wait for select options to appear and click on USER
    await waitFor(() => {
      const userOption = screen.getByText('user');
      fireEvent.click(userOption);
    });
    
    // Check that the URL was updated with the filter
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('entityType=user'));
    
    // Check that the fetch was called with the filter
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
  
  it('handles pagination correctly', async () => {
    // Mock pagination data
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: Array(10).fill(null).map((_, i) => ({
          id: `${i}`,
          userId: `user-${i}`,
          entityType: AuditEntityType.USER,
          entityId: `entity-${i}`,
          action: AuditAction.CREATE,
          details: {},
          ipAddress: `127.0.0.${i}`,
          userAgent: `Test Agent ${i}`,
          timestamp: new Date().toISOString(),
        })),
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 25,
          totalPages: 3,
        },
      }),
    });
    
    render(<AuditLogViewer />);
    
    // Wait for initial data load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Click on next page
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Check that page was updated in state and URL
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    
    // Check that fetch was called with the new page
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
  
  it('handles errors correctly', async () => {
    // Mock error response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    });
    
    render(<AuditLogViewer />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Error fetching audit logs/)).toBeInTheDocument();
    });
  });
});
