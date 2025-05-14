/**
 * Expert Service Repository
 * 
 * Handles database operations for expert services
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import {
  ExpertService,
  ExpertServiceCreateData
} from '@/types/consultation';

/**
 * Map database row to ExpertService object
 */
function mapExpertServiceFromDb(row: any): ExpertService {
  return {
    id: row.id,
    expertId: row.expert_id,
    name: row.name,
    description: row.description,
    duration: row.duration,
    price: parseFloat(row.price),
    currency: row.currency,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Create a new expert service
 */
export async function createExpertService(
  data: ExpertServiceCreateData
): Promise<ExpertService> {
  const id = uuidv4();
  const isActive = data.isActive !== undefined ? data.isActive : true;
  
  const result = await db.query(
    `INSERT INTO expert_services (
      id, expert_id, name, description, duration, price, currency, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      id, data.expertId, data.name, data.description, 
      data.duration, data.price, data.currency, isActive
    ]
  );
  
  return mapExpertServiceFromDb(result.rows[0]);
}

/**
 * Get expert service by ID
 */
export async function getExpertServiceById(id: string): Promise<ExpertService | null> {
  const result = await db.query(
    `SELECT * FROM expert_services WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapExpertServiceFromDb(result.rows[0]);
}

/**
 * Get expert services by expert ID
 */
export async function getExpertServicesByExpertId(
  expertId: string,
  activeOnly: boolean = true
): Promise<ExpertService[]> {
  let query = `SELECT * FROM expert_services WHERE expert_id = $1`;
  const params: any[] = [expertId];
  
  if (activeOnly) {
    query += ` AND is_active = TRUE`;
  }
  
  query += ` ORDER BY price ASC`;
  
  const result = await db.query(query, params);
  
  return result.rows.map(mapExpertServiceFromDb);
}

/**
 * Update expert service
 */
export async function updateExpertService(
  id: string,
  data: {
    name?: string;
    description?: string;
    duration?: number;
    price?: number;
    currency?: string;
    isActive?: boolean;
  }
): Promise<ExpertService | null> {
  // Build the SET clause dynamically based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  
  if (data.duration !== undefined) {
    updates.push(`duration = $${paramIndex++}`);
    values.push(data.duration);
  }
  
  if (data.price !== undefined) {
    updates.push(`price = $${paramIndex++}`);
    values.push(data.price);
  }
  
  if (data.currency !== undefined) {
    updates.push(`currency = $${paramIndex++}`);
    values.push(data.currency);
  }
  
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = NOW()`);
  
  // If no fields to update, return the existing service
  if (updates.length === 1) {
    return getExpertServiceById(id);
  }
  
  // Add the ID as the last parameter
  values.push(id);
  
  const result = await db.query(
    `UPDATE expert_services 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapExpertServiceFromDb(result.rows[0]);
}

/**
 * Delete expert service
 */
export async function deleteExpertService(id: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM expert_services WHERE id = $1 RETURNING id`,
    [id]
  );
  
  return result.rows.length > 0;
}

/**
 * Get all active expert services
 */
export async function getAllActiveExpertServices(): Promise<ExpertService[]> {
  const result = await db.query(
    `SELECT es.*, 
            u.first_name as expert_first_name, 
            u.last_name as expert_last_name
     FROM expert_services es
     JOIN users u ON es.expert_id = u.id
     WHERE es.is_active = TRUE
     ORDER BY es.price ASC`
  );
  
  return result.rows.map(row => ({
    ...mapExpertServiceFromDb(row),
    expertName: `${row.expert_first_name} ${row.expert_last_name}`
  }));
}
