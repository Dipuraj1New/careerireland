/**
 * Notification Preferences Component Tests
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import { getUserNotificationPreferences, updateUserNotificationPreferences } from '@/services/notification/notificationClient';
import { NotificationType } from '@/types/notification';

// Mock the notification client
jest.mock('@/services/notification/notificationClient', () => ({
  getUserNotificationPreferences: jest.fn(),
  updateUserNotificationPreferences: jest.fn(),
}));

describe('NotificationPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    // Mock the API call to delay
    (getUserNotificationPreferences as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<NotificationPreferences />);

    // Check loading state
    expect(screen.getByText('Loading notification preferences...')).toBeInTheDocument();
  });

  it('should render preferences when loaded', async () => {
    // Mock preferences data
    const mockPreferences = [
      {
        type: NotificationType.CASE_STATUS_CHANGE,
        inApp: true,
        email: true,
        sms: false,
      },
      {
        type: NotificationType.DOCUMENT_UPLOADED,
        inApp: true,
        email: false,
        sms: false,
      },
    ];

    // Mock the API call
    (getUserNotificationPreferences as jest.Mock).mockResolvedValue(mockPreferences);

    render(<NotificationPreferences />);

    // Wait for preferences to load
    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });

    // Check that preferences are rendered
    expect(screen.getByText('Case Status Change')).toBeInTheDocument();
    expect(screen.getByText('Document Uploaded')).toBeInTheDocument();
  });

  it('should handle preference changes', async () => {
    // Mock preferences data
    const mockPreferences = [
      {
        type: NotificationType.CASE_STATUS_CHANGE,
        inApp: true,
        email: false,
        sms: false,
      },
    ];

    // Mock the API calls
    (getUserNotificationPreferences as jest.Mock).mockResolvedValue(mockPreferences);
    (updateUserNotificationPreferences as jest.Mock).mockResolvedValue(undefined);

    render(<NotificationPreferences />);

    // Wait for preferences to load
    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });

    // Find the email checkbox for Case Status Change
    const emailCheckbox = screen.getAllByRole('checkbox')[1]; // Second checkbox (email)
    
    // Toggle the checkbox
    fireEvent.click(emailCheckbox);

    // Save preferences
    fireEvent.click(screen.getByText('Save Preferences'));

    // Check that updateUserNotificationPreferences was called with updated preferences
    await waitFor(() => {
      expect(updateUserNotificationPreferences).toHaveBeenCalledWith([
        {
          type: NotificationType.CASE_STATUS_CHANGE,
          inApp: true,
          email: true, // Changed to true
          sms: false,
        },
      ]);
    });

    // Check success message
    expect(screen.getByText('Notification preferences saved successfully')).toBeInTheDocument();
  });

  it('should handle API errors when loading preferences', async () => {
    // Mock API error
    (getUserNotificationPreferences as jest.Mock).mockRejectedValue(
      new Error('Failed to load preferences')
    );

    // Mock console.error to prevent test output pollution
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<NotificationPreferences />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load notification preferences')).toBeInTheDocument();
    });

    // Check that default preferences are shown
    expect(screen.getByText('Case Status Change')).toBeInTheDocument();
    expect(screen.getByText('Document Uploaded')).toBeInTheDocument();

    // Check console.error was called
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle API errors when saving preferences', async () => {
    // Mock preferences data
    const mockPreferences = [
      {
        type: NotificationType.CASE_STATUS_CHANGE,
        inApp: true,
        email: false,
        sms: false,
      },
    ];

    // Mock API calls
    (getUserNotificationPreferences as jest.Mock).mockResolvedValue(mockPreferences);
    (updateUserNotificationPreferences as jest.Mock).mockRejectedValue(
      new Error('Failed to save preferences')
    );

    // Mock console.error to prevent test output pollution
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<NotificationPreferences />);

    // Wait for preferences to load
    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });

    // Save preferences
    fireEvent.click(screen.getByText('Save Preferences'));

    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Failed to save notification preferences')).toBeInTheDocument();
    });

    // Check console.error was called
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
