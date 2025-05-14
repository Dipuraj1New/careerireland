/**
 * Analytics Metric Repository
 * 
 * Handles database operations for analytics metrics
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import {
  AnalyticsMetric,
  AnalyticsMetricCreateData,
  AnalyticsMetricValue
} from '@/types/analytics';

/**
 * Map database row to AnalyticsMetric object
 */
function mapAnalyticsMetricFromDb(row: any): AnalyticsMetric {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    calculationQuery: row.calculation_query,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Map database row to AnalyticsMetricValue object
 */
function mapAnalyticsMetricValueFromDb(row: any): AnalyticsMetricValue {
  return {
    id: row.id,
    metricId: row.metric_id,
    dateKey: row.date_key,
    value: parseFloat(row.value),
    dimensionValues: row.dimension_values,
    createdAt: row.created_at
  };
}

/**
 * Create a new analytics metric
 */
export async function createAnalyticsMetric(
  data: AnalyticsMetricCreateData
): Promise<AnalyticsMetric> {
  const id = uuidv4();
  const isActive = data.isActive !== undefined ? data.isActive : true;
  
  const result = await db.query(
    `INSERT INTO analytics_metrics (
      id, name, description, category, calculation_query, is_active, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      id, data.name, data.description, data.category, 
      data.calculationQuery, isActive, data.createdBy
    ]
  );
  
  return mapAnalyticsMetricFromDb(result.rows[0]);
}

/**
 * Get analytics metric by ID
 */
export async function getAnalyticsMetricById(id: string): Promise<AnalyticsMetric | null> {
  const result = await db.query(
    `SELECT * FROM analytics_metrics WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAnalyticsMetricFromDb(result.rows[0]);
}

/**
 * Get analytics metrics by category
 */
export async function getAnalyticsMetricsByCategory(
  category: string,
  activeOnly: boolean = true
): Promise<AnalyticsMetric[]> {
  let query = `SELECT * FROM analytics_metrics WHERE category = $1`;
  const params: any[] = [category];
  
  if (activeOnly) {
    query += ` AND is_active = TRUE`;
  }
  
  query += ` ORDER BY name ASC`;
  
  const result = await db.query(query, params);
  
  return result.rows.map(mapAnalyticsMetricFromDb);
}

/**
 * Get all analytics metrics
 */
export async function getAllAnalyticsMetrics(
  activeOnly: boolean = true
): Promise<AnalyticsMetric[]> {
  let query = `SELECT * FROM analytics_metrics`;
  
  if (activeOnly) {
    query += ` WHERE is_active = TRUE`;
  }
  
  query += ` ORDER BY category ASC, name ASC`;
  
  const result = await db.query(query);
  
  return result.rows.map(mapAnalyticsMetricFromDb);
}

/**
 * Update analytics metric
 */
export async function updateAnalyticsMetric(
  id: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    calculationQuery?: string;
    isActive?: boolean;
  }
): Promise<AnalyticsMetric | null> {
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
  
  if (data.category !== undefined) {
    updates.push(`category = $${paramIndex++}`);
    values.push(data.category);
  }
  
  if (data.calculationQuery !== undefined) {
    updates.push(`calculation_query = $${paramIndex++}`);
    values.push(data.calculationQuery);
  }
  
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = NOW()`);
  
  // If no fields to update, return the existing metric
  if (updates.length === 1) {
    return getAnalyticsMetricById(id);
  }
  
  // Add the ID as the last parameter
  values.push(id);
  
  const result = await db.query(
    `UPDATE analytics_metrics 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAnalyticsMetricFromDb(result.rows[0]);
}

/**
 * Delete analytics metric
 */
export async function deleteAnalyticsMetric(id: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM analytics_metrics WHERE id = $1 RETURNING id`,
    [id]
  );
  
  return result.rows.length > 0;
}

/**
 * Store metric value
 */
export async function storeMetricValue(
  metricId: string,
  dateKey: Date,
  value: number,
  dimensionValues?: Record<string, any>
): Promise<AnalyticsMetricValue> {
  const id = uuidv4();
  
  const result = await db.query(
    `INSERT INTO analytics_metric_values (
      id, metric_id, date_key, value, dimension_values
    ) VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (metric_id, date_key, dimension_values) 
    DO UPDATE SET value = $4
    RETURNING *`,
    [id, metricId, dateKey, value, dimensionValues]
  );
  
  return mapAnalyticsMetricValueFromDb(result.rows[0]);
}

/**
 * Get metric values
 */
export async function getMetricValues(
  metricId: string,
  startDate: Date,
  endDate: Date,
  dimensionValues?: Record<string, any>
): Promise<AnalyticsMetricValue[]> {
  let query = `
    SELECT * FROM analytics_metric_values 
    WHERE metric_id = $1 
    AND date_key >= $2 
    AND date_key <= $3
  `;
  const params: any[] = [metricId, startDate, endDate];
  
  if (dimensionValues) {
    query += ` AND dimension_values @> $4`;
    params.push(dimensionValues);
  }
  
  query += ` ORDER BY date_key ASC`;
  
  const result = await db.query(query, params);
  
  return result.rows.map(mapAnalyticsMetricValueFromDb);
}
