/**
 * API endpoint for expert availability
 * 
 * GET /api/consultations/availability
 * Query parameters:
 * - expertId: string (required)
 * - startDate: string (required, format: YYYY-MM-DD)
 * - endDate: string (required, format: YYYY-MM-DD)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AvailabilitySlot } from '@/types/consultation';
import { parseISO, addDays, setHours, setMinutes } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const expertId = searchParams.get('expertId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    
    // Validate required parameters
    if (!expertId || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Missing required parameters: expertId, startDate, endDate' },
        { status: 400 }
      );
    }
    
    // Parse dates
    let startDate: Date;
    let endDate: Date;
    
    try {
      startDate = parseISO(startDateStr);
      endDate = parseISO(endDateStr);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would call a service to get available slots
    // For now, we'll generate mock data
    
    // Generate mock available slots
    const availableSlots: AvailabilitySlot[] = [];
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      // Skip weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Generate 3-5 slots per day
        const slotsPerDay = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < slotsPerDay; i++) {
          // Generate slots between 9am and 5pm
          const hour = 9 + Math.floor(Math.random() * 8);
          const minute = Math.random() < 0.5 ? 0 : 30;
          
          const slotStartTime = new Date(currentDate);
          slotStartTime.setHours(hour, minute, 0, 0);
          
          const slotEndTime = new Date(slotStartTime);
          slotEndTime.setMinutes(slotEndTime.getMinutes() + 60);
          
          // Only add future slots
          if (slotStartTime > new Date()) {
            availableSlots.push({
              expertId,
              startTime: slotStartTime,
              endTime: slotEndTime,
              expertName: 'John Doe', // In a real implementation, this would come from the database
            });
          }
        }
      }
      
      // Move to next day
      currentDate = addDays(currentDate, 1);
    }
    
    // Sort slots by start time
    availableSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    return NextResponse.json({ availableSlots });
  } catch (error: any) {
    console.error('Error getting expert availability:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get expert availability' },
      { status: 500 }
    );
  }
}
