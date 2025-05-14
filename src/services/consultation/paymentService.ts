/**
 * Payment Service
 * 
 * Handles payment processing for consultations
 */
import { v4 as uuidv4 } from 'uuid';
import config from '@/lib/config';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import { sendNotification } from '@/services/notification/notificationService';
import { NotificationType } from '@/types/notification';
import { getUserById } from '@/services/user/userRepository';
import {
  ConsultationPayment,
  PaymentStatus,
  InvoiceDetails
} from '@/types/consultation';
import * as consultationRepository from './consultationRepository';
import * as consultationPaymentRepository from './consultationPaymentRepository';
import * as expertServiceRepository from './expertServiceRepository';

// Stripe API configuration
const STRIPE_SECRET_KEY = config.integrations?.stripe?.secretKey || '';
const STRIPE_PUBLIC_KEY = config.integrations?.stripe?.publicKey || '';
const STRIPE_WEBHOOK_SECRET = config.integrations?.stripe?.webhookSecret || '';

/**
 * Process payment for a consultation
 */
export async function processPayment(
  consultationId: string,
  paymentMethod: string,
  userId: string
): Promise<{ success: boolean; payment?: ConsultationPayment; message?: string }> {
  try {
    // Get the consultation
    const consultation = await consultationRepository.getConsultationById(consultationId);
    if (!consultation) {
      return { success: false, message: 'Consultation not found' };
    }

    // Check if the user is authorized (should be the applicant)
    if (consultation.applicantId !== userId) {
      return { success: false, message: 'Unauthorized to process payment for this consultation' };
    }

    // Check if payment already exists
    const existingPayment = await consultationPaymentRepository.getPaymentByConsultationId(consultationId);
    if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
      return { success: true, payment: existingPayment };
    }

    // Get the expert's service details
    // In a real implementation, you would have a service ID associated with the consultation
    const expertServices = await expertServiceRepository.getExpertServicesByExpertId(
      consultation.expertId,
      true
    );
    
    if (expertServices.length === 0) {
      return { success: false, message: 'No active services found for this expert' };
    }

    // Find the service that matches the consultation duration
    const service = expertServices.find(s => s.duration === consultation.duration) || expertServices[0];

    // In a real implementation, you would integrate with Stripe or another payment processor
    // For this example, we'll simulate a successful payment
    
    // Create a payment record
    const payment = await consultationPaymentRepository.createConsultationPayment({
      consultationId,
      amount: service.price,
      currency: service.currency,
      status: PaymentStatus.COMPLETED, // In a real implementation, this would start as PENDING
      paymentMethod,
      paymentProvider: 'stripe',
      transactionId: `sim_${uuidv4()}`, // Simulated transaction ID
      invoiceNumber: `INV-${Date.now()}`,
      metadata: {
        serviceName: service.name,
        serviceId: service.id
      }
    });

    // Generate invoice URL
    const invoiceUrl = `/api/consultations/${consultationId}/invoice`;
    await consultationPaymentRepository.updatePaymentStatus(
      payment.id,
      PaymentStatus.COMPLETED,
      payment.transactionId,
      { ...payment.metadata, invoiceUrl }
    );

    // Send notifications
    const expert = await getUserById(consultation.expertId);
    const applicant = await getUserById(consultation.applicantId);

    await sendNotification({
      userId: consultation.expertId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Received',
      message: `Payment of ${service.price} ${service.currency} has been received for your consultation with ${applicant.firstName} ${applicant.lastName}`,
      metadata: {
        consultationId,
        paymentId: payment.id,
        amount: service.price,
        currency: service.currency
      }
    });

    await sendNotification({
      userId: consultation.applicantId,
      type: NotificationType.PAYMENT_COMPLETED,
      title: 'Payment Completed',
      message: `Your payment of ${service.price} ${service.currency} for the consultation with ${expert.firstName} ${expert.lastName} has been completed`,
      metadata: {
        consultationId,
        paymentId: payment.id,
        amount: service.price,
        currency: service.currency,
        invoiceUrl
      }
    });

    // Create audit log
    await createAuditLog({
      action: AuditAction.PAYMENT,
      entityType: AuditEntityType.CONSULTATION,
      entityId: consultationId,
      userId,
      metadata: {
        paymentId: payment.id,
        amount: service.price,
        currency: service.currency,
        status: PaymentStatus.COMPLETED
      }
    });

    return { success: true, payment };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { success: false, message: `Failed to process payment: ${error.message}` };
  }
}

/**
 * Generate invoice for a consultation
 */
export async function generateInvoice(
  consultationId: string,
  userId: string
): Promise<{ success: boolean; invoice?: InvoiceDetails; message?: string }> {
  try {
    // Get the consultation
    const consultation = await consultationRepository.getConsultationById(consultationId);
    if (!consultation) {
      return { success: false, message: 'Consultation not found' };
    }

    // Check if the user is authorized (either the expert, the applicant, or an admin)
    if (consultation.expertId !== userId && consultation.applicantId !== userId) {
      // In a real implementation, you would check if the user is an admin
      return { success: false, message: 'Unauthorized to generate invoice for this consultation' };
    }

    // Get the payment
    const payment = await consultationPaymentRepository.getPaymentByConsultationId(consultationId);
    if (!payment) {
      return { success: false, message: 'No payment found for this consultation' };
    }

    // Get user details
    const expert = await getUserById(consultation.expertId);
    const applicant = await getUserById(consultation.applicantId);

    if (!expert || !applicant) {
      return { success: false, message: 'Could not find user details' };
    }

    // Get service details
    const expertServices = await expertServiceRepository.getExpertServicesByExpertId(
      consultation.expertId,
      true
    );
    
    const service = expertServices.find(s => s.duration === consultation.duration) || expertServices[0];

    // Calculate tax (example: 20% VAT)
    const taxRate = 0.2;
    const subtotal = payment.amount;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Generate invoice details
    const invoice: InvoiceDetails = {
      invoiceNumber: payment.invoiceNumber || `INV-${Date.now()}`,
      invoiceUrl: payment.invoiceUrl || `/api/consultations/${consultationId}/invoice`,
      amount: payment.amount,
      currency: payment.currency,
      consultationId,
      expertName: `${expert.firstName} ${expert.lastName}`,
      applicantName: `${applicant.firstName} ${applicant.lastName}`,
      date: payment.createdAt,
      dueDate: new Date(payment.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
      items: [
        {
          description: service ? service.name : 'Immigration Consultation',
          quantity: 1,
          unitPrice: subtotal,
          amount: subtotal
        }
      ],
      subtotal,
      tax,
      total
    };

    // In a real implementation, you would generate a PDF invoice
    // and store it in your file storage system

    return { success: true, invoice };
  } catch (error) {
    console.error('Error generating invoice:', error);
    return { success: false, message: `Failed to generate invoice: ${error.message}` };
  }
}

/**
 * Process refund for a consultation payment
 */
export async function processRefund(
  paymentId: string,
  amount: number,
  reason: string,
  userId: string
): Promise<{ success: boolean; payment?: ConsultationPayment; message?: string }> {
  try {
    // Get the payment
    const payment = await consultationPaymentRepository.getConsultationPaymentById(paymentId);
    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    // Get the consultation
    const consultation = await consultationRepository.getConsultationById(payment.consultationId);
    if (!consultation) {
      return { success: false, message: 'Consultation not found' };
    }

    // Check if the user is authorized (should be the expert or an admin)
    if (consultation.expertId !== userId) {
      // In a real implementation, you would check if the user is an admin
      return { success: false, message: 'Unauthorized to process refund for this payment' };
    }

    // Check if the payment can be refunded
    if (payment.status !== PaymentStatus.COMPLETED) {
      return { success: false, message: `Cannot refund a payment with status: ${payment.status}` };
    }

    // Validate refund amount
    if (amount <= 0 || amount > payment.amount) {
      return { success: false, message: 'Invalid refund amount' };
    }

    // In a real implementation, you would integrate with Stripe or another payment processor
    // For this example, we'll simulate a successful refund
    
    // Process the refund
    const updatedPayment = await consultationPaymentRepository.processRefund(
      paymentId,
      amount,
      reason,
      { refundedBy: userId }
    );

    if (!updatedPayment) {
      return { success: false, message: 'Failed to process refund' };
    }

    // Send notifications
    const expert = await getUserById(consultation.expertId);
    const applicant = await getUserById(consultation.applicantId);

    await sendNotification({
      userId: consultation.expertId,
      type: NotificationType.REFUND_PROCESSED,
      title: 'Refund Processed',
      message: `Refund of ${amount} ${payment.currency} has been processed for your consultation with ${applicant.firstName} ${applicant.lastName}. Reason: ${reason}`,
      metadata: {
        consultationId: consultation.id,
        paymentId,
        refundAmount: amount,
        currency: payment.currency,
        reason
      }
    });

    await sendNotification({
      userId: consultation.applicantId,
      type: NotificationType.REFUND_PROCESSED,
      title: 'Refund Processed',
      message: `A refund of ${amount} ${payment.currency} has been processed for your consultation with ${expert.firstName} ${expert.lastName}. Reason: ${reason}`,
      metadata: {
        consultationId: consultation.id,
        paymentId,
        refundAmount: amount,
        currency: payment.currency,
        reason
      }
    });

    // Create audit log
    await createAuditLog({
      action: AuditAction.REFUND,
      entityType: AuditEntityType.PAYMENT,
      entityId: paymentId,
      userId,
      metadata: {
        consultationId: consultation.id,
        refundAmount: amount,
        currency: payment.currency,
        reason,
        status: updatedPayment.status
      }
    });

    return { success: true, payment: updatedPayment };
  } catch (error) {
    console.error('Error processing refund:', error);
    return { success: false, message: `Failed to process refund: ${error.message}` };
  }
}
