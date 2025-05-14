import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationList from '@/components/notifications/NotificationList';
import { NotificationType } from '@/types/notification';

// Mock the NotificationItem component
jest.mock('@/components/notifications/NotificationItem', () => {
  return ({ notification, onMarkAsRead }: any) => (
    <div data-testid={`notification-${notification.id}`}>
      <span>{notification.title}</span>
      <button onClick={() => onMarkAsRead(notification.id)}>Mark as read</button>
    </div>
  );
});

describe('NotificationList', () => {
  const mockOnMarkAsRead = jest.fn();
  const mockOnMarkAllAsRead = jest.fn();
  
  const notifications = [
    {
      id: '1',
      userId: 'user1',
      type: NotificationType.CASE_STATUS_CHANGE,
      title: 'Status Change 1',
      message: 'Your case status has changed',
      isRead: false,
      createdAt: new Date('2023-01-02'),
    },
    {
      id: '2',
      userId: 'user1',
      type: NotificationType.DOCUMENT_UPLOADED,
      title: 'Document Uploaded',
      message: 'A new document has been uploaded',
      isRead: true,
      createdAt: new Date('2023-01-03'),
    },
    {
      id: '3',
      userId: 'user1',
      type: NotificationType.ACTION_REQUIRED,
      title: 'Action Required',
      message: 'Please take action on your case',
      isRead: false,
      createdAt: new Date('2023-01-01'),
    },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders notifications correctly', () => {
    render(
      <NotificationList 
        notifications={notifications} 
        onMarkAsRead={mockOnMarkAsRead} 
        onMarkAllAsRead={mockOnMarkAllAsRead} 
      />
    );
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('2 unread')).toBeInTheDocument();
    expect(screen.getByText('Mark all as read')).toBeInTheDocument();
    
    expect(screen.getByTestId('notification-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-2')).toBeInTheDocument();
    expect(screen.getByTestId('notification-3')).toBeInTheDocument();
  });
  
  it('calls onMarkAllAsRead when clicking "Mark all as read"', () => {
    render(
      <NotificationList 
        notifications={notifications} 
        onMarkAsRead={mockOnMarkAsRead} 
        onMarkAllAsRead={mockOnMarkAllAsRead} 
      />
    );
    
    fireEvent.click(screen.getByText('Mark all as read'));
    expect(mockOnMarkAllAsRead).toHaveBeenCalledTimes(1);
  });
  
  it('calls onMarkAsRead when marking a notification as read', () => {
    render(
      <NotificationList 
        notifications={notifications} 
        onMarkAsRead={mockOnMarkAsRead} 
        onMarkAllAsRead={mockOnMarkAllAsRead} 
      />
    );
    
    fireEvent.click(screen.getAllByText('Mark as read')[0]);
    expect(mockOnMarkAsRead).toHaveBeenCalledWith('1');
  });
  
  it('filters notifications correctly', () => {
    render(
      <NotificationList 
        notifications={notifications} 
        onMarkAsRead={mockOnMarkAsRead} 
        onMarkAllAsRead={mockOnMarkAllAsRead} 
      />
    );
    
    // Initially all notifications are shown
    expect(screen.getByTestId('notification-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-2')).toBeInTheDocument();
    expect(screen.getByTestId('notification-3')).toBeInTheDocument();
    
    // Filter by document_uploaded
    fireEvent.change(screen.getByLabelText('Filter'), { target: { value: 'document_uploaded' } });
    
    // Only the document_uploaded notification should be visible
    expect(screen.queryByTestId('notification-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('notification-2')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-3')).not.toBeInTheDocument();
  });
  
  it('sorts notifications correctly', () => {
    render(
      <NotificationList 
        notifications={notifications} 
        onMarkAsRead={mockOnMarkAsRead} 
        onMarkAllAsRead={mockOnMarkAllAsRead} 
      />
    );
    
    // Change sort to oldest first
    fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'oldest' } });
    
    // Check that the order of notifications has changed
    const notificationElements = screen.getAllByTestId(/notification-/);
    expect(notificationElements[0]).toHaveAttribute('data-testid', 'notification-3');
    expect(notificationElements[1]).toHaveAttribute('data-testid', 'notification-1');
    expect(notificationElements[2]).toHaveAttribute('data-testid', 'notification-2');
  });
  
  it('displays empty state when no notifications', () => {
    render(
      <NotificationList 
        notifications={[]} 
        onMarkAsRead={mockOnMarkAsRead} 
        onMarkAllAsRead={mockOnMarkAllAsRead} 
      />
    );
    
    expect(screen.getByText('No notifications found.')).toBeInTheDocument();
    expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
  });
});
