/**
 * Consultation Types
 * 
 * Type definitions for the consultation module
 */

export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export interface ExpertAvailability {
  id: string;
  expertId: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrenceRule?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Consultation {
  id: string;
  expertId: string;
  applicantId: string;
  caseId?: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // in minutes
  status: ConsultationStatus;
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  notes?: string;
  feedbackRating?: number;
  feedbackComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultationPayment {
  id: string;
  consultationId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  paymentProvider?: string;
  transactionId?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  refundAmount?: number;
  refundReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpertService {
  id: string;
  expertId: string;
  name: string;
  description?: string;
  duration: number; // in minutes
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpertAvailabilityCreateData {
  expertId: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrenceRule?: string;
}

export interface ConsultationCreateData {
  expertId: string;
  applicantId: string;
  caseId?: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  status?: ConsultationStatus;
}

export interface ConsultationUpdateData {
  title?: string;
  description?: string;
  scheduledAt?: Date;
  duration?: number;
  status?: ConsultationStatus;
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  notes?: string;
  feedbackRating?: number;
  feedbackComment?: string;
}

export interface ConsultationPaymentCreateData {
  consultationId: string;
  amount: number;
  currency: string;
  status?: PaymentStatus;
  paymentMethod?: string;
  paymentProvider?: string;
  transactionId?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  metadata?: Record<string, any>;
}

export interface ExpertServiceCreateData {
  expertId: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  currency: string;
  isActive?: boolean;
}

export interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  expertId: string;
  expertName?: string;
}

export interface MeetingDetails {
  meetingUrl: string;
  meetingId: string;
  meetingPassword?: string;
  startTime: Date;
  duration: number;
}

export interface InvoiceDetails {
  invoiceNumber: string;
  invoiceUrl: string;
  amount: number;
  currency: string;
  consultationId: string;
  expertName: string;
  applicantName: string;
  date: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}
