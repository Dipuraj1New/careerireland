import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AvailabilityCalendar from '../AvailabilityCalendar';
import { addDays, format } from 'date-fns';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      availableSlots: [
        {
          expertId: '1',
          startTime: new Date(2023, 5, 15, 9, 0).toISOString(),
          endTime: new Date(2023, 5, 15, 10, 0).toISOString(),
          expertName: 'John Doe',
        },
        {
          expertId: '1',
          startTime: new Date(2023, 5, 15, 11, 0).toISOString(),
          endTime: new Date(2023, 5, 15, 12, 0).toISOString(),
          expertName: 'John Doe',
        },
        {
          expertId: '1',
          startTime: new Date(2023, 5, 16, 14, 0).toISOString(),
          endTime: new Date(2023, 5, 16, 15, 0).toISOString(),
          expertName: 'John Doe',
        },
      ],
    }),
  })
) as jest.Mock;

describe('AvailabilityCalendar Component', () => {
  const mockExpertId = '1';
  const mockOnSelectSlot = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the calendar with days of the week', async () => {
    render(
      <AvailabilityCalendar
        expertId={mockExpertId}
        onSelectSlot={mockOnSelectSlot}
      />
    );
    
    // Wait for the calendar to load
    await waitFor(() => {
      expect(screen.getByText('Available Time Slots')).toBeInTheDocument();
    });
    
    // Check that days of the week are displayed
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });
  
  it('fetches available slots on load', async () => {
    render(
      <AvailabilityCalendar
        expertId={mockExpertId}
        onSelectSlot={mockOnSelectSlot}
      />
    );
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    
    const fetchCall = (fetch as jest.Mock).mock.calls[0][0];
    expect(fetchCall).toContain(`/api/consultations/availability?expertId=${mockExpertId}`);
    expect(fetchCall).toContain('startDate=');
    expect(fetchCall).toContain('endDate=');
  });
  
  it('displays available time slots', async () => {
    // Mock the current date to ensure consistent test results
    jest.spyOn(global.Date, 'now').mockImplementation(() => new Date(2023, 5, 14).getTime());
    
    render(
      <AvailabilityCalendar
        expertId={mockExpertId}
        onSelectSlot={mockOnSelectSlot}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
      expect(screen.getByText('11:00 AM')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    });
  });
  
  it('calls onSelectSlot when a slot is clicked', async () => {
    render(
      <AvailabilityCalendar
        expertId={mockExpertId}
        onSelectSlot={mockOnSelectSlot}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('9:00 AM'));
    
    expect(mockOnSelectSlot).toHaveBeenCalledTimes(1);
    expect(mockOnSelectSlot).toHaveBeenCalledWith(expect.objectContaining({
      expertId: '1',
      expertName: 'John Doe',
    }));
  });
  
  it('highlights the selected slot', async () => {
    const selectedSlot = {
      expertId: '1',
      startTime: new Date(2023, 5, 15, 9, 0),
      endTime: new Date(2023, 5, 15, 10, 0),
      expertName: 'John Doe',
    };
    
    render(
      <AvailabilityCalendar
        expertId={mockExpertId}
        onSelectSlot={mockOnSelectSlot}
        selectedSlot={selectedSlot}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });
    
    // The selected slot should have a different style
    const selectedButton = screen.getByText('9:00 AM').closest('button');
    expect(selectedButton).toHaveClass('bg-indigo-600');
    expect(selectedButton).toHaveClass('text-white');
    
    // Other slots should not be highlighted
    const otherButton = screen.getByText('11:00 AM').closest('button');
    expect(otherButton).not.toHaveClass('bg-indigo-600');
    expect(otherButton).not.toHaveClass('text-white');
  });
  
  it('navigates to previous and next weeks', async () => {
    // Mock the current date to ensure consistent test results
    const currentDate = new Date(2023, 5, 14);
    jest.spyOn(global.Date, 'now').mockImplementation(() => currentDate.getTime());
    
    render(
      <AvailabilityCalendar
        expertId={mockExpertId}
        onSelectSlot={mockOnSelectSlot}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Available Time Slots')).toBeInTheDocument();
    });
    
    // Get the current week's dates
    const currentWeekDates = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(currentDate, i);
      return format(date, 'MMM d');
    });
    
    // Check that current week dates are displayed
    for (const dateStr of currentWeekDates) {
      expect(screen.getByText(dateStr)).toBeInTheDocument();
    }
    
    // Click next week button
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // Fetch should be called again for the next week
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
    
    // Click previous week button
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    
    // Fetch should be called again for the previous week
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });
  
  it('shows loading state while fetching slots', async () => {
    // Mock fetch to delay response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => 
          resolve({
            ok: true,
            json: () => Promise.resolve({ availableSlots: [] }),
          }), 
          100
        )
      )
    );
    
    render(
      <AvailabilityCalendar
        expertId={mockExpertId}
        onSelectSlot={mockOnSelectSlot}
      />
    );
    
    // Loading spinner should be visible
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
  
  it('shows error message when fetch fails', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.reject(new Error('Network error'))
    );
    
    render(
      <AvailabilityCalendar
        expertId={mockExpertId}
        onSelectSlot={mockOnSelectSlot}
      />
    );
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Failed to load availability/i)).toBeInTheDocument();
    });
  });
});
