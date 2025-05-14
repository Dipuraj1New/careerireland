/**
 * Consultation Payment Repository
 * 
 * Handles database operations for consultation payments
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import {
  ConsultationPayment,
  ConsultationPaymentCreateData,
  PaymentStatus
} from '@/types/consultation';

/**
 * Map database row to ConsultationPayment object
 */
function mapConsultationPaymentFromDb(row: any): ConsultationPayment {
  return {
    id: row.id,
    consultationId: row.consultation_id,
    amount: parseFloat(row.amount),
    currency: row.currency,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentProvider: row.payment_provider,
    transactionId: row.transaction_id,
    invoiceNumber: row.invoice_number,
    invoiceUrl: row.invoice_url,
    refundAmount: row.refund_amount ? parseFloat(row.refund_amount) : undefined,
    refundReason: row.refund_reason,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Create a new consultation payment
 */
export async function createConsultationPayment(
  data: ConsultationPaymentCreateData
): Promise<ConsultationPayment> {
  const id = uuidv4();
  const status = data.status || PaymentStatus.PENDING;
  
  const result = await db.query(
    `INSERT INTO consultation_payments (
      id, consultation_id, amount, currency, status, payment_method,
      payment_provider, transaction_id, invoice_number, invoice_url, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      id, data.consultationId, data.amount, data.currency, status,
      data.paymentMethod, data.paymentProvider, data.transactionId,
      data.invoiceNumber, data.invoiceUrl, data.metadata
    ]
  );
  
  return mapConsultationPaymentFromDb(result.rows[0]);
}

/**
 * Get payment by ID
 */
export async function getConsultationPaymentById(id: string): Promise<ConsultationPayment | null> {
  const result = await db.query(
    `SELECT * FROM consultation_payments WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapConsultationPaymentFromDb(result.rows[0]);
}

/**
 * Get payment by consultation ID
 */
export async function getPaymentByConsultationId(consultationId: string): Promise<ConsultationPayment | null> {
  const result = await db.query(
    `SELECT * FROM consultation_payments 
     WHERE consultation_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [consultationId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapConsultationPaymentFromDb(result.rows[0]);
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  transactionId?: string,
  metadata?: Record<string, any>
): Promise<ConsultationPayment | null> {
  const updates: string[] = ['status = $1', 'updated_at = NOW()'];
  const values: any[] = [status];
  let paramIndex = 2;
  
  if (transactionId !== undefined) {
    updates.push(`transaction_id = $${paramIndex++}`);
    values.push(transactionId);
  }
  
  if (metadata !== undefined) {
    updates.push(`metadata = $${paramIndex++}`);
    values.push(metadata);
  }
  
  values.push(id);
  
  const result = await db.query(
    `UPDATE consultation_payments 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapConsultationPaymentFromDb(result.rows[0]);
}

/**
 * Process refund
 */
export async function processRefund(
  id: string,
  refundAmount: number,
  refundReason: string,
  metadata?: Record<string, any>
): Promise<ConsultationPayment | null> {
  // Get the current payment
  const payment = await getConsultationPaymentById(id);
  if (!payment) {
    return null;
  }
  
  // Determine the new status based on refund amount
  const newStatus = refundAmount >= payment.amount 
    ? PaymentStatus.REFUNDED 
    : PaymentStatus.PARTIALLY_REFUNDED;
  
  // Update the payment with refund information
  const result = await db.query(
    `UPDATE consultation_payments 
     SET status = $1, 
         refund_amount = $2, 
         refund_reason = $3,
         metadata = COALESCE($4, metadata),
         updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [newStatus, refundAmount, refundReason, metadata, id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapConsultationPaymentFromDb(result.rows[0]);
}

/**
 * Get payments by date range
 */
export async function getPaymentsByDateRange(
  startDate: Date,
  endDate: Date,
  status?: PaymentStatus | PaymentStatus[]
): Promise<ConsultationPayment[]> {
  let query = `
    SELECT * FROM consultation_payments 
    WHERE created_at >= $1 AND created_at <= $2
  `;
  const params: any[] = [startDate, endDate];
  let paramIndex = 3;
  
  if (status) {
    if (Array.isArray(status)) {
      query += ` AND status = ANY($${paramIndex++})`;
      params.push(status);
    } else {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
  }
  
  query += ` ORDER BY created_at DESC`;
  
  const result = await db.query(query, params);
  
  return result.rows.map(mapConsultationPaymentFromDb);
}
