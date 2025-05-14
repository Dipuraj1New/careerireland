/**
 * Video Conference Service
 * 
 * Handles integration with video conferencing services like Zoom or Google Meet
 */
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import config from '@/lib/config';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import { MeetingDetails } from '@/types/consultation';
import * as consultationRepository from './consultationRepository';

// Zoom API configuration
const ZOOM_API_URL = 'https://api.zoom.us/v2';
const ZOOM_API_KEY = config.integrations?.zoom?.apiKey || '';
const ZOOM_API_SECRET = config.integrations?.zoom?.apiSecret || '';
const ZOOM_USER_ID = config.integrations?.zoom?.userId || '';

// Google Meet API configuration
const GOOGLE_MEET_API_URL = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_API_KEY = config.integrations?.google?.apiKey || '';
const GOOGLE_CLIENT_ID = config.integrations?.google?.clientId || '';
const GOOGLE_CLIENT_SECRET = config.integrations?.google?.clientSecret || '';
const GOOGLE_CALENDAR_ID = config.integrations?.google?.calendarId || '';

/**
 * Create a Zoom meeting
 */
export async function createZoomMeeting(
  consultationId: string,
  title: string,
  startTime: Date,
  duration: number,
  description?: string
): Promise<MeetingDetails | null> {
  try {
    if (!ZOOM_API_KEY || !ZOOM_API_SECRET || !ZOOM_USER_ID) {
      throw new Error('Zoom API configuration missing');
    }

    // Generate JWT token for Zoom API
    // In a real implementation, you would use a proper JWT library
    const token = 'dummy_jwt_token';

    // Create meeting in Zoom
    const response = await axios.post(
      `${ZOOM_API_URL}/users/${ZOOM_USER_ID}/meetings`,
      {
        topic: title,
        type: 2, // Scheduled meeting
        start_time: startTime.toISOString(),
        duration, // in minutes
        timezone: 'UTC',
        agenda: description || 'Immigration consultation',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          auto_recording: 'cloud',
          waiting_room: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.id) {
      throw new Error('Invalid response from Zoom API');
    }

    const meetingDetails: MeetingDetails = {
      meetingUrl: response.data.join_url,
      meetingId: response.data.id.toString(),
      meetingPassword: response.data.password,
      startTime,
      duration
    };

    // Update consultation with meeting details
    await consultationRepository.updateConsultation(consultationId, {
      meetingUrl: meetingDetails.meetingUrl,
      meetingId: meetingDetails.meetingId,
      meetingPassword: meetingDetails.meetingPassword
    });

    // Log the meeting creation
    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.MEETING,
      entityId: consultationId,
      userId: ZOOM_USER_ID,
      metadata: {
        provider: 'Zoom',
        meetingId: meetingDetails.meetingId
      }
    });

    return meetingDetails;
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    return null;
  }
}

/**
 * Create a Google Meet meeting
 */
export async function createGoogleMeetMeeting(
  consultationId: string,
  title: string,
  startTime: Date,
  duration: number,
  description?: string
): Promise<MeetingDetails | null> {
  try {
    if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALENDAR_ID) {
      throw new Error('Google API configuration missing');
    }

    // Generate OAuth token for Google API
    // In a real implementation, you would use a proper OAuth library
    const token = 'dummy_oauth_token';

    // Calculate end time
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Create event in Google Calendar with Meet conferencing
    const response = await axios.post(
      `${GOOGLE_MEET_API_URL}/calendars/${GOOGLE_CALENDAR_ID}/events`,
      {
        summary: title,
        description: description || 'Immigration consultation',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC'
        },
        conferenceData: {
          createRequest: {
            requestId: uuidv4(),
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          conferenceDataVersion: 1
        }
      }
    );

    if (!response.data || !response.data.conferenceData) {
      throw new Error('Invalid response from Google API');
    }

    const meetingDetails: MeetingDetails = {
      meetingUrl: response.data.conferenceData.entryPoints[0].uri,
      meetingId: response.data.id,
      startTime,
      duration
    };

    // Update consultation with meeting details
    await consultationRepository.updateConsultation(consultationId, {
      meetingUrl: meetingDetails.meetingUrl,
      meetingId: meetingDetails.meetingId
    });

    // Log the meeting creation
    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.MEETING,
      entityId: consultationId,
      userId: GOOGLE_CALENDAR_ID,
      metadata: {
        provider: 'Google Meet',
        meetingId: meetingDetails.meetingId
      }
    });

    return meetingDetails;
  } catch (error) {
    console.error('Error creating Google Meet meeting:', error);
    return null;
  }
}

/**
 * Create a meeting based on configured provider
 */
export async function createMeeting(
  consultationId: string,
  title: string,
  startTime: Date,
  duration: number,
  description?: string
): Promise<MeetingDetails | null> {
  // Determine which provider to use based on configuration
  const provider = config.integrations?.videoConference?.provider || 'zoom';

  if (provider === 'zoom') {
    return createZoomMeeting(consultationId, title, startTime, duration, description);
  } else if (provider === 'google-meet') {
    return createGoogleMeetMeeting(consultationId, title, startTime, duration, description);
  } else {
    throw new Error(`Unsupported video conference provider: ${provider}`);
  }
}

/**
 * Get recording URL for a meeting
 */
export async function getRecordingUrl(
  meetingId: string,
  provider: 'zoom' | 'google-meet' = 'zoom'
): Promise<string | null> {
  try {
    if (provider === 'zoom') {
      if (!ZOOM_API_KEY || !ZOOM_API_SECRET) {
        throw new Error('Zoom API configuration missing');
      }

      // Generate JWT token for Zoom API
      const token = 'dummy_jwt_token';

      // Get recordings from Zoom
      const response = await axios.get(
        `${ZOOM_API_URL}/meetings/${meetingId}/recordings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.data || !response.data.recording_files || response.data.recording_files.length === 0) {
        return null;
      }

      // Return the URL of the first recording file
      return response.data.recording_files[0].download_url;
    } else if (provider === 'google-meet') {
      // Google Meet doesn't provide a direct API for recordings
      // In a real implementation, you would need to use Google Drive API
      return null;
    } else {
      throw new Error(`Unsupported video conference provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error getting recording URL from ${provider}:`, error);
    return null;
  }
}
