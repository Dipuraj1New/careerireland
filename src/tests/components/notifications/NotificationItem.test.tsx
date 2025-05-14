import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationItem from '@/components/notifications/NotificationItem';
import { NotificationType } from '@/types/notification';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '5 minutes ago'),
}));

describe('NotificationItem', () => {
  const mockOnMarkAsRead = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders unread notification correctly', () => {
    const notification = {
      id: '123',
      userId: 'user1',
      type: NotificationType.CASE_STATUS_CHANGE,
      title: 'Test Title',
      message: 'Test Message',
      isRead: false,
      createdAt: new Date(),
    };
    
    render(
      <NotificationItem 
        notification={notification} 
        onMarkAsRead={mockOnMarkAsRead} 
      />
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Case Status Change')).toBeInTheDocument();
  });
  
  it('renders read notification correctly', () => {
    const notification = {
      id: '123',
      userId: 'user1',
      type: NotificationType.CASE_STATUS_CHANGE,
      title: 'Test Title',
      message: 'Test Message',
      isRead: true,
      createdAt: new Date(),
    };
    
    render(
      <NotificationItem 
        notification={notification} 
        onMarkAsRead={mockOnMarkAsRead} 
      />
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });
  
  it('calls onMarkAsRead when clicking on unread notification', () => {
    const notification = {
      id: '123',
      userId: 'user1',
      type: NotificationType.CASE_STATUS_CHANGE,
      title: 'Test Title',
      message: 'Test Message',
      isRead: false,
      createdAt: new Date(),
    };
    
    render(
      <NotificationItem 
        notification={notification} 
        onMarkAsRead={mockOnMarkAsRead} 
      />
    );
    
    fireEvent.click(screen.getByText('Test Title'));
    expect(mockOnMarkAsRead).toHaveBeenCalledWith('123');
  });
  
  it('does not call onMarkAsRead when clicking on read notification', () => {
    const notification = {
      id: '123',
      userId: 'user1',
      type: NotificationType.CASE_STATUS_CHANGE,
      title: 'Test Title',
      message: 'Test Message',
      isRead: true,
      createdAt: new Date(),
    };
    
    render(
      <NotificationItem 
        notification={notification} 
        onMarkAsRead={mockOnMarkAsRead} 
      />
    );
    
    fireEvent.click(screen.getByText('Test Title'));
    expect(mockOnMarkAsRead).not.toHaveBeenCalled();
  });
  
  it('renders notification with link correctly', () => {
    const notification = {
      id: '123',
      userId: 'user1',
      type: NotificationType.CASE_STATUS_CHANGE,
      title: 'Test Title',
      message: 'Test Message',
      isRead: false,
      entityId: 'case123',
      entityType: 'case',
      link: '/cases/123',
      createdAt: new Date(),
    };
    
    render(
      <NotificationItem 
        notification={notification} 
        onMarkAsRead={mockOnMarkAsRead} 
      />
    );
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/cases/123');
  });
});
