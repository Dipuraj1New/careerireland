/**
 * Consultation Service
 * 
 * Handles business logic for consultations
 */
import { v4 as uuidv4 } from 'uuid';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import { sendNotification } from '@/services/notification/notificationService';
import { NotificationType } from '@/types/notification';
import { getUserById } from '@/services/user/userRepository';
import { getCaseById } from '@/services/case/caseRepository';
import {
  Consultation,
  ConsultationCreateData,
  ConsultationStatus,
  AvailabilitySlot
} from '@/types/consultation';
import * as consultationRepository from './consultationRepository';
import * as expertAvailabilityRepository from './expertAvailabilityRepository';
import * as consultationPaymentRepository from './consultationPaymentRepository';
import * as calendarIntegrationService from './calendarIntegrationService';
import * as videoConferenceService from './videoConferenceService';
import * as paymentService from './paymentService';

/**
 * Schedule a consultation
 */
export async function scheduleConsultation(
  data: ConsultationCreateData,
  userId: string
): Promise<{ success: boolean; consultation?: Consultation; message?: string }> {
  try {
    // Validate that the expert exists
    const expert = await getUserById(data.expertId);
    if (!expert) {
      return { success: false, message: 'Expert not found' };
    }

    // Validate that the applicant exists
    const applicant = await getUserById(data.applicantId);
    if (!applicant) {
      return { success: false, message: 'Applicant not found' };
    }

    // If case ID is provided, validate that it exists
    if (data.caseId) {
      const caseRecord = await getCaseById(data.caseId);
      if (!caseRecord) {
        return { success: false, message: 'Case not found' };
      }
    }

    // Check if the expert is available at the requested time
    const startDate = new Date(data.scheduledAt);
    const endDate = new Date(startDate.getTime() + data.duration * 60000);
    
    const availableSlots = await expertAvailabilityRepository.getAvailableTimeSlots(
      data.expertId,
      startDate,
      endDate
    );

    // Check if the requested time falls within any available slot
    const isAvailable = availableSlots.some(slot => 
      slot.startTime <= startDate && slot.endTime >= endDate
    );

    if (!isAvailable) {
      return { success: false, message: 'Expert is not available at the requested time' };
    }

    // Create the consultation
    const consultation = await consultationRepository.createConsultation(data);

    // Create calendar event
    const calendarEvent = await calendarIntegrationService.createCalendlyEvent(
      consultation.id,
      consultation.expertId,
      consultation.applicantId,
      consultation.scheduledAt,
      consultation.duration,
      consultation.title,
      consultation.description
    );

    // Send notifications
    await sendNotification({
      userId: data.expertId,
      type: NotificationType.CONSULTATION_SCHEDULED,
      title: 'New Consultation Scheduled',
      message: `A new consultation has been scheduled with ${applicant.firstName} ${applicant.lastName} on ${startDate.toLocaleString()}`,
      metadata: {
        consultationId: consultation.id,
        scheduledAt: startDate.toISOString()
      }
    });

    await sendNotification({
      userId: data.applicantId,
      type: NotificationType.CONSULTATION_SCHEDULED,
      title: 'Consultation Scheduled',
      message: `Your consultation with ${expert.firstName} ${expert.lastName} has been scheduled for ${startDate.toLocaleString()}`,
      metadata: {
        consultationId: consultation.id,
        scheduledAt: startDate.toISOString()
      }
    });

    // Create audit log
    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.CONSULTATION,
      entityId: consultation.id,
      userId,
      metadata: {
        expertId: data.expertId,
        applicantId: data.applicantId,
        scheduledAt: startDate.toISOString()
      }
    });

    return { success: true, consultation };
  } catch (error) {
    console.error('Error scheduling consultation:', error);
    return { success: false, message: `Failed to schedule consultation: ${error.message}` };
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
  return expertAvailabilityRepository.getAvailableTimeSlots(
    expertId,
    startDate,
    endDate
  );
}

/**
 * Create a meeting for a consultation
 */
export async function createMeeting(
  consultationId: string,
  userId: string
): Promise<{ success: boolean; meetingUrl?: string; message?: string }> {
  try {
    // Get the consultation
    const consultation = await consultationRepository.getConsultationById(consultationId);
    if (!consultation) {
      return { success: false, message: 'Consultation not found' };
    }

    // Check if the user is authorized (either the expert or the applicant)
    if (consultation.expertId !== userId && consultation.applicantId !== userId) {
      return { success: false, message: 'Unauthorized to create meeting for this consultation' };
    }

    // Check if a meeting already exists
    if (consultation.meetingUrl) {
      return { success: true, meetingUrl: consultation.meetingUrl };
    }

    // Create the meeting
    const meetingDetails = await videoConferenceService.createMeeting(
      consultationId,
      consultation.title,
      consultation.scheduledAt,
      consultation.duration,
      consultation.description
    );

    if (!meetingDetails) {
      return { success: false, message: 'Failed to create meeting' };
    }

    // Update consultation status to confirmed
    await consultationRepository.updateConsultation(consultationId, {
      status: ConsultationStatus.CONFIRMED,
      meetingUrl: meetingDetails.meetingUrl,
      meetingId: meetingDetails.meetingId,
      meetingPassword: meetingDetails.meetingPassword
    });

    // Send notifications
    await sendNotification({
      userId: consultation.expertId,
      type: NotificationType.MEETING_CREATED,
      title: 'Meeting Created',
      message: `A meeting has been created for your consultation on ${consultation.scheduledAt.toLocaleString()}`,
      metadata: {
        consultationId,
        meetingUrl: meetingDetails.meetingUrl
      }
    });

    await sendNotification({
      userId: consultation.applicantId,
      type: NotificationType.MEETING_CREATED,
      title: 'Meeting Created',
      message: `A meeting has been created for your consultation on ${consultation.scheduledAt.toLocaleString()}`,
      metadata: {
        consultationId,
        meetingUrl: meetingDetails.meetingUrl
      }
    });

    // Create audit log
    await createAuditLog({
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.CONSULTATION,
      entityId: consultationId,
      userId,
      metadata: {
        status: ConsultationStatus.CONFIRMED,
        meetingUrl: meetingDetails.meetingUrl
      }
    });

    return { success: true, meetingUrl: meetingDetails.meetingUrl };
  } catch (error) {
    console.error('Error creating meeting:', error);
    return { success: false, message: `Failed to create meeting: ${error.message}` };
  }
}

/**
 * Cancel a consultation
 */
export async function cancelConsultation(
  consultationId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; message?: string }> {
  try {
    // Get the consultation
    const consultation = await consultationRepository.getConsultationById(consultationId);
    if (!consultation) {
      return { success: false, message: 'Consultation not found' };
    }

    // Check if the user is authorized (either the expert or the applicant)
    if (consultation.expertId !== userId && consultation.applicantId !== userId) {
      return { success: false, message: 'Unauthorized to cancel this consultation' };
    }

    // Check if the consultation can be cancelled
    if (consultation.status === ConsultationStatus.COMPLETED || 
        consultation.status === ConsultationStatus.CANCELLED) {
      return { success: false, message: `Cannot cancel a consultation with status: ${consultation.status}` };
    }

    // Cancel the consultation
    await consultationRepository.updateConsultation(consultationId, {
      status: ConsultationStatus.CANCELLED,
      notes: consultation.notes 
        ? `${consultation.notes}\n\nCancelled: ${reason}`
        : `Cancelled: ${reason}`
    });

    // If there's a meeting, cancel it
    if (consultation.meetingId) {
      // This would depend on the video conferencing provider
      // For simplicity, we're not implementing the actual cancellation here
    }

    // If there's a payment, process refund if applicable
    const payment = await consultationPaymentRepository.getPaymentByConsultationId(consultationId);
    if (payment && payment.status === 'completed') {
      // Process refund based on cancellation policy
      // This is a simplified example
      const now = new Date();
      const consultationTime = new Date(consultation.scheduledAt);
      const hoursDifference = (consultationTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // If cancelled more than 24 hours in advance, full refund
      if (hoursDifference >= 24) {
        await consultationPaymentRepository.processRefund(
          payment.id,
          payment.amount,
          `Full refund for cancellation more than 24 hours in advance. Reason: ${reason}`,
          { cancelledBy: userId }
        );
      } 
      // If cancelled between 12-24 hours in advance, 50% refund
      else if (hoursDifference >= 12) {
        await consultationPaymentRepository.processRefund(
          payment.id,
          payment.amount / 2,
          `Partial refund (50%) for cancellation between 12-24 hours in advance. Reason: ${reason}`,
          { cancelledBy: userId }
        );
      }
      // No refund for cancellations less than 12 hours in advance
    }

    // Send notifications
    await sendNotification({
      userId: consultation.expertId,
      type: NotificationType.CONSULTATION_CANCELLED,
      title: 'Consultation Cancelled',
      message: `The consultation scheduled for ${consultation.scheduledAt.toLocaleString()} has been cancelled. Reason: ${reason}`,
      metadata: {
        consultationId,
        cancelledBy: userId
      }
    });

    await sendNotification({
      userId: consultation.applicantId,
      type: NotificationType.CONSULTATION_CANCELLED,
      title: 'Consultation Cancelled',
      message: `The consultation scheduled for ${consultation.scheduledAt.toLocaleString()} has been cancelled. Reason: ${reason}`,
      metadata: {
        consultationId,
        cancelledBy: userId
      }
    });

    // Create audit log
    await createAuditLog({
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.CONSULTATION,
      entityId: consultationId,
      userId,
      metadata: {
        status: ConsultationStatus.CANCELLED,
        reason
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error cancelling consultation:', error);
    return { success: false, message: `Failed to cancel consultation: ${error.message}` };
  }
}
