'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, addWeeks, isSameDay, parseISO } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AvailabilitySlot } from '@/types/consultation';

interface AvailabilityCalendarProps {
  expertId: string;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  selectedSlot?: AvailabilitySlot;
}

export default function AvailabilityCalendar({ expertId, onSelectSlot, selectedSlot }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate the start of the week (Sunday)
  const weekStart = startOfWeek(currentDate);
  
  // Generate array of 7 days starting from the week start
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Fetch available slots for the current week
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const startDate = format(weekStart, 'yyyy-MM-dd');
        const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');
        
        // In a real implementation, this would call an API endpoint
        // For now, we'll simulate some available slots
        const response = await fetch(
          `/api/consultations/availability?expertId=${expertId}&startDate=${startDate}&endDate=${endDate}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch availability');
        }
        
        const data = await response.json();
        
        // Convert string dates to Date objects
        const slots = data.availableSlots.map((slot: any) => ({
          ...slot,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
        }));
        
        setAvailableSlots(slots);
      } catch (err) {
        console.error('Error fetching available slots:', err);
        setError('Failed to load availability. Please try again.');
        
        // For demo purposes, generate some mock slots
        const mockSlots: AvailabilitySlot[] = [];
        days.forEach(day => {
          // Add 2-3 slots per day
          const slotsPerDay = Math.floor(Math.random() * 2) + 2;
          for (let i = 0; i < slotsPerDay; i++) {
            const hour = 9 + i * 2; // 9am, 11am, 1pm, etc.
            const startTime = new Date(day);
            startTime.setHours(hour, 0, 0, 0);
            const endTime = new Date(day);
            endTime.setHours(hour + 1, 0, 0, 0);
            
            mockSlots.push({
              expertId,
              startTime,
              endTime,
              expertName: 'John Doe'
            });
          }
        });
        
        setAvailableSlots(mockSlots);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailableSlots();
  }, [expertId, weekStart]);
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentDate(prev => addWeeks(prev, -1));
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentDate(prev => addWeeks(prev, 1));
  };
  
  // Group slots by day
  const slotsByDay = days.map(day => {
    return {
      date: day,
      slots: availableSlots.filter(slot => isSameDay(slot.startTime, day))
    };
  });
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Available Time Slots</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Select a time slot for your consultation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {days.map((day, i) => (
              <div key={i} className="text-center">
                <div className="text-sm font-medium mb-1">{format(day, 'EEE')}</div>
                <div className="text-xs text-gray-500">{format(day, 'MMM d')}</div>
              </div>
            ))}
            
            {/* Time slots */}
            {slotsByDay.map((day, dayIndex) => (
              <div key={dayIndex} className="space-y-2 mt-2">
                {day.slots.length > 0 ? (
                  day.slots.map((slot, slotIndex) => (
                    <Button
                      key={slotIndex}
                      variant={selectedSlot && isSameDay(selectedSlot.startTime, slot.startTime) && 
                              selectedSlot.startTime.getTime() === slot.startTime.getTime() 
                        ? "default" 
                        : "outline"}
                      className={`w-full text-xs py-1 px-2 h-auto ${
                        selectedSlot && isSameDay(selectedSlot.startTime, slot.startTime) && 
                        selectedSlot.startTime.getTime() === slot.startTime.getTime()
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-indigo-50 hover:text-indigo-700"
                      }`}
                      onClick={() => onSelectSlot(slot)}
                    >
                      {format(slot.startTime, 'h:mm a')}
                    </Button>
                  ))
                ) : (
                  <div className="text-center text-xs text-gray-400 py-2">No slots</div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
