/**
 * Calendar Integration Service
 * 
 * Handles integration with calendar services like Calendly
 */
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import config from '@/lib/config';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import { AvailabilitySlot } from '@/types/consultation';
import * as expertAvailabilityRepository from './expertAvailabilityRepository';
import * as consultationRepository from './consultationRepository';

// Calendly API configuration
const CALENDLY_API_URL = 'https://api.calendly.com';
const CALENDLY_API_KEY = config.integrations?.calendly?.apiKey || '';
const CALENDLY_USER = config.integrations?.calendly?.user || '';

/**
 * Sync expert availability with Calendly
 */
export async function syncExpertAvailabilityWithCalendly(
  expertId: string,
  calendlyUserUri: string
): Promise<boolean> {
  try {
    if (!CALENDLY_API_KEY) {
      throw new Error('Calendly API key not configured');
    }

    // Get expert's availability from Calendly
    const response = await axios.get(`${CALENDLY_API_URL}/user_availability_schedules`, {
      headers: {
        'Authorization': `Bearer ${CALENDLY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        user: calendlyUserUri
      }
    });

    if (!response.data || !response.data.collection) {
      throw new Error('Invalid response from Calendly API');
    }

    // Process each availability schedule
    for (const schedule of response.data.collection) {
      // Process each day of the week
      for (const rule of schedule.rules) {
        if (rule.type === 'wday') {
          // For each time interval on this day
          for (const interval of rule.intervals) {
            // Create availability record
            await expertAvailabilityRepository.createExpertAvailability({
              expertId,
              startTime: new Date(), // This would need proper calculation based on day and time
              endTime: new Date(),   // This would need proper calculation based on day and time
              isRecurring: true,
              recurrenceRule: `FREQ=WEEKLY;BYDAY=${rule.wday.toUpperCase()}`
            });
          }
        }
      }
    }

    // Log the sync
    await createAuditLog({
      action: AuditAction.SYNC,
      entityType: AuditEntityType.EXPERT_AVAILABILITY,
      entityId: expertId,
      userId: expertId,
      metadata: {
        source: 'Calendly',
        scheduleCount: response.data.collection.length
      }
    });

    return true;
  } catch (error) {
    console.error('Error syncing with Calendly:', error);
    return false;
  }
}

/**
 * Create a Calendly event for a consultation
 */
export async function createCalendlyEvent(
  consultationId: string,
  expertId: string,
  applicantId: string,
  scheduledAt: Date,
  duration: number,
  title: string,
  description?: string
): Promise<{ eventUrl: string; eventId: string } | null> {
  try {
    if (!CALENDLY_API_KEY || !CALENDLY_USER) {
      throw new Error('Calendly API configuration missing');
    }

    // Get user information for the invitees
    // In a real implementation, you would fetch this from your user repository
    const expertEmail = 'expert@example.com'; // Replace with actual email
    const applicantEmail = 'applicant@example.com'; // Replace with actual email

    // Create event in Calendly
    const response = await axios.post(
      `${CALENDLY_API_URL}/scheduled_events`,
      {
        event_type: 'consultation',
        start_time: scheduledAt.toISOString(),
        end_time: new Date(scheduledAt.getTime() + duration * 60000).toISOString(),
        name: title,
        description: description || 'Immigration consultation',
        location: {
          type: 'custom',
          location: 'Video conference (details will be provided)'
        },
        invitees: [
          {
            email: expertEmail,
            name: 'Expert'
          },
          {
            email: applicantEmail,
            name: 'Applicant'
          }
        ],
        event_memberships: [
          {
            user: CALENDLY_USER
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${CALENDLY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.uri) {
      throw new Error('Invalid response from Calendly API');
    }

    // Extract event ID from URI
    const eventId = response.data.uri.split('/').pop();
    const eventUrl = response.data.booking_url;

    // Log the event creation
    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.CONSULTATION,
      entityId: consultationId,
      userId: expertId,
      metadata: {
        source: 'Calendly',
        eventId,
        eventUrl
      }
    });

    return {
      eventUrl,
      eventId
    };
  } catch (error) {
    console.error('Error creating Calendly event:', error);
    return null;
  }
}

/**
 * Get available time slots for an expert
 */
export async function getAvailableTimeSlots(
  expertId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailabilitySlot[]> {
  // Get slots from our database
  return expertAvailabilityRepository.getAvailableTimeSlots(
    expertId,
    startDate,
    endDate
  );
}

/**
 * Cancel a Calendly event
 */
export async function cancelCalendlyEvent(
  eventId: string,
  reason: string
): Promise<boolean> {
  try {
    if (!CALENDLY_API_KEY) {
      throw new Error('Calendly API key not configured');
    }

    // Cancel event in Calendly
    await axios.post(
      `${CALENDLY_API_URL}/scheduled_events/${eventId}/cancellation`,
      {
        reason
      },
      {
        headers: {
          'Authorization': `Bearer ${CALENDLY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return true;
  } catch (error) {
    console.error('Error cancelling Calendly event:', error);
    return false;
  }
}
