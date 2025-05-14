/**
 * Expert Availability Repository
 * 
 * Handles database operations for expert availability
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import {
  ExpertAvailability,
  ExpertAvailabilityCreateData,
  AvailabilitySlot
} from '@/types/consultation';

/**
 * Map database row to ExpertAvailability object
 */
function mapExpertAvailabilityFromDb(row: any): ExpertAvailability {
  return {
    id: row.id,
    expertId: row.expert_id,
    startTime: row.start_time,
    endTime: row.end_time,
    isRecurring: row.is_recurring,
    recurrenceRule: row.recurrence_rule,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Create a new expert availability
 */
export async function createExpertAvailability(
  data: ExpertAvailabilityCreateData
): Promise<ExpertAvailability> {
  const id = uuidv4();
  
  const result = await db.query(
    `INSERT INTO expert_availability (
      id, expert_id, start_time, end_time, is_recurring, recurrence_rule
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      id, data.expertId, data.startTime, data.endTime, 
      data.isRecurring, data.recurrenceRule
    ]
  );
  
  return mapExpertAvailabilityFromDb(result.rows[0]);
}

/**
 * Get expert availability by ID
 */
export async function getExpertAvailabilityById(id: string): Promise<ExpertAvailability | null> {
  const result = await db.query(
    `SELECT * FROM expert_availability WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapExpertAvailabilityFromDb(result.rows[0]);
}

/**
 * Get expert availability by expert ID
 */
export async function getExpertAvailabilityByExpertId(
  expertId: string,
  startDate: Date,
  endDate: Date
): Promise<ExpertAvailability[]> {
  const result = await db.query(
    `SELECT * FROM expert_availability 
     WHERE expert_id = $1
     AND (
       (start_time >= $2 AND start_time <= $3)
       OR (end_time >= $2 AND end_time <= $3)
       OR (start_time <= $2 AND end_time >= $3)
     )
     ORDER BY start_time ASC`,
    [expertId, startDate, endDate]
  );
  
  return result.rows.map(mapExpertAvailabilityFromDb);
}

/**
 * Update expert availability
 */
export async function updateExpertAvailability(
  id: string,
  data: {
    startTime?: Date;
    endTime?: Date;
    isRecurring?: boolean;
    recurrenceRule?: string;
  }
): Promise<ExpertAvailability | null> {
  // Build the SET clause dynamically based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.startTime !== undefined) {
    updates.push(`start_time = $${paramIndex++}`);
    values.push(data.startTime);
  }
  
  if (data.endTime !== undefined) {
    updates.push(`end_time = $${paramIndex++}`);
    values.push(data.endTime);
  }
  
  if (data.isRecurring !== undefined) {
    updates.push(`is_recurring = $${paramIndex++}`);
    values.push(data.isRecurring);
  }
  
  if (data.recurrenceRule !== undefined) {
    updates.push(`recurrence_rule = $${paramIndex++}`);
    values.push(data.recurrenceRule);
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = NOW()`);
  
  // If no fields to update, return the existing availability
  if (updates.length === 1) {
    return getExpertAvailabilityById(id);
  }
  
  // Add the ID as the last parameter
  values.push(id);
  
  const result = await db.query(
    `UPDATE expert_availability 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapExpertAvailabilityFromDb(result.rows[0]);
}

/**
 * Delete expert availability
 */
export async function deleteExpertAvailability(id: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM expert_availability WHERE id = $1 RETURNING id`,
    [id]
  );
  
  return result.rows.length > 0;
}

/**
 * Get available time slots for an expert
 */
export async function getAvailableTimeSlots(
  expertId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailabilitySlot[]> {
  // First, get all availability records for the expert
  const availabilityRecords = await getExpertAvailabilityByExpertId(
    expertId,
    startDate,
    endDate
  );
  
  // Then, get all scheduled consultations for the expert
  const consultationsResult = await db.query(
    `SELECT * FROM consultations 
     WHERE expert_id = $1
     AND scheduled_at >= $2
     AND scheduled_at <= $3
     AND status NOT IN ('cancelled', 'no_show')
     ORDER BY scheduled_at ASC`,
    [expertId, startDate, endDate]
  );
  
  const consultations = consultationsResult.rows.map(row => ({
    startTime: row.scheduled_at,
    endTime: new Date(row.scheduled_at.getTime() + row.duration * 60000)
  }));
  
  // Calculate available slots by removing booked times from availability
  const availableSlots: AvailabilitySlot[] = [];
  
  for (const availability of availabilityRecords) {
    let currentStart = new Date(availability.startTime);
    const availabilityEnd = new Date(availability.endTime);
    
    // Sort consultations by start time
    const relevantConsultations = consultations.filter(c => 
      (c.startTime >= currentStart && c.startTime < availabilityEnd) ||
      (c.endTime > currentStart && c.endTime <= availabilityEnd) ||
      (c.startTime <= currentStart && c.endTime >= availabilityEnd)
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    // If no consultations in this availability period, add the whole period
    if (relevantConsultations.length === 0) {
      availableSlots.push({
        startTime: currentStart,
        endTime: availabilityEnd,
        expertId
      });
      continue;
    }
    
    // Process each consultation to find gaps
    for (const consultation of relevantConsultations) {
      // If there's a gap before this consultation, add it
      if (currentStart < consultation.startTime) {
        availableSlots.push({
          startTime: currentStart,
          endTime: consultation.startTime,
          expertId
        });
      }
      
      // Move current start to after this consultation
      currentStart = new Date(Math.max(
        currentStart.getTime(),
        consultation.endTime.getTime()
      ));
    }
    
    // If there's time left after the last consultation, add it
    if (currentStart < availabilityEnd) {
      availableSlots.push({
        startTime: currentStart,
        endTime: availabilityEnd,
        expertId
      });
    }
  }
  
  return availableSlots;
}
