/**
 * Analytics Report Repository
 * 
 * Handles database operations for analytics reports and schedules
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import {
  AnalyticsReport,
  AnalyticsReportCreateData,
  AnalyticsReportSchedule,
  AnalyticsReportScheduleCreateData,
  AnalyticsReportExecution,
  ReportType,
  ReportFormat,
  ReportFrequency
} from '@/types/analytics';

/**
 * Map database row to AnalyticsReport object
 */
function mapAnalyticsReportFromDb(row: any): AnalyticsReport {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    query: row.query,
    parameters: row.parameters,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Map database row to AnalyticsReportSchedule object
 */
function mapAnalyticsReportScheduleFromDb(row: any): AnalyticsReportSchedule {
  return {
    id: row.id,
    reportId: row.report_id,
    frequency: row.frequency,
    dayOfWeek: row.day_of_week,
    dayOfMonth: row.day_of_month,
    timeOfDay: row.time_of_day,
    format: row.format,
    recipients: row.recipients,
    isActive: row.is_active,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Map database row to AnalyticsReportExecution object
 */
function mapAnalyticsReportExecutionFromDb(row: any): AnalyticsReportExecution {
  return {
    id: row.id,
    reportId: row.report_id,
    scheduleId: row.schedule_id,
    parameters: row.parameters,
    status: row.status,
    resultFilePath: row.result_file_path,
    errorMessage: row.error_message,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdBy: row.created_by
  };
}

/**
 * Create a new analytics report
 */
export async function createAnalyticsReport(
  data: AnalyticsReportCreateData
): Promise<AnalyticsReport> {
  const id = uuidv4();
  
  const result = await db.query(
    `INSERT INTO analytics_reports (
      id, name, description, type, query, parameters, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      id, data.name, data.description, data.type, 
      data.query, data.parameters, data.createdBy
    ]
  );
  
  return mapAnalyticsReportFromDb(result.rows[0]);
}

/**
 * Get analytics report by ID
 */
export async function getAnalyticsReportById(id: string): Promise<AnalyticsReport | null> {
  const result = await db.query(
    `SELECT * FROM analytics_reports WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAnalyticsReportFromDb(result.rows[0]);
}

/**
 * Get all analytics reports
 */
export async function getAllAnalyticsReports(
  type?: ReportType
): Promise<AnalyticsReport[]> {
  let query = `SELECT * FROM analytics_reports`;
  const params: any[] = [];
  
  if (type) {
    query += ` WHERE type = $1`;
    params.push(type);
  }
  
  query += ` ORDER BY name ASC`;
  
  const result = await db.query(query, params);
  
  return result.rows.map(mapAnalyticsReportFromDb);
}

/**
 * Get reports by created by
 */
export async function getReportsByCreatedBy(
  userId: string
): Promise<AnalyticsReport[]> {
  const result = await db.query(
    `SELECT * FROM analytics_reports 
     WHERE created_by = $1
     ORDER BY name ASC`,
    [userId]
  );
  
  return result.rows.map(mapAnalyticsReportFromDb);
}

/**
 * Update analytics report
 */
export async function updateAnalyticsReport(
  id: string,
  data: {
    name?: string;
    description?: string;
    query?: string;
    parameters?: Record<string, any>;
  }
): Promise<AnalyticsReport | null> {
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
  
  if (data.query !== undefined) {
    updates.push(`query = $${paramIndex++}`);
    values.push(data.query);
  }
  
  if (data.parameters !== undefined) {
    updates.push(`parameters = $${paramIndex++}`);
    values.push(data.parameters);
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = NOW()`);
  
  // If no fields to update, return the existing report
  if (updates.length === 1) {
    return getAnalyticsReportById(id);
  }
  
  // Add the ID as the last parameter
  values.push(id);
  
  const result = await db.query(
    `UPDATE analytics_reports 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAnalyticsReportFromDb(result.rows[0]);
}

/**
 * Delete analytics report
 */
export async function deleteAnalyticsReport(id: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM analytics_reports WHERE id = $1 RETURNING id`,
    [id]
  );
  
  return result.rows.length > 0;
}

/**
 * Create a new report schedule
 */
export async function createReportSchedule(
  data: AnalyticsReportScheduleCreateData
): Promise<AnalyticsReportSchedule> {
  const id = uuidv4();
  const isActive = data.isActive !== undefined ? data.isActive : true;
  
  // Calculate next run time based on frequency
  const nextRunAt = calculateNextRunTime(
    data.frequency,
    data.timeOfDay,
    data.dayOfWeek,
    data.dayOfMonth
  );
  
  const result = await db.query(
    `INSERT INTO analytics_report_schedules (
      id, report_id, frequency, day_of_week, day_of_month, time_of_day,
      format, recipients, is_active, next_run_at, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      id, data.reportId, data.frequency, data.dayOfWeek, data.dayOfMonth,
      data.timeOfDay, data.format, data.recipients, isActive, nextRunAt,
      data.createdBy
    ]
  );
  
  return mapAnalyticsReportScheduleFromDb(result.rows[0]);
}

/**
 * Get report schedule by ID
 */
export async function getReportScheduleById(id: string): Promise<AnalyticsReportSchedule | null> {
  const result = await db.query(
    `SELECT * FROM analytics_report_schedules WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAnalyticsReportScheduleFromDb(result.rows[0]);
}

/**
 * Get schedules by report ID
 */
export async function getSchedulesByReportId(
  reportId: string,
  activeOnly: boolean = false
): Promise<AnalyticsReportSchedule[]> {
  let query = `SELECT * FROM analytics_report_schedules WHERE report_id = $1`;
  const params: any[] = [reportId];
  
  if (activeOnly) {
    query += ` AND is_active = TRUE`;
  }
  
  query += ` ORDER BY next_run_at ASC`;
  
  const result = await db.query(query, params);
  
  return result.rows.map(mapAnalyticsReportScheduleFromDb);
}

/**
 * Get schedules due for execution
 */
export async function getSchedulesDueForExecution(): Promise<AnalyticsReportSchedule[]> {
  const now = new Date();
  
  const result = await db.query(
    `SELECT * FROM analytics_report_schedules 
     WHERE is_active = TRUE 
     AND next_run_at <= $1
     ORDER BY next_run_at ASC`,
    [now]
  );
  
  return result.rows.map(mapAnalyticsReportScheduleFromDb);
}

/**
 * Update report schedule
 */
export async function updateReportSchedule(
  id: string,
  data: {
    frequency?: ReportFrequency;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timeOfDay?: string;
    format?: ReportFormat;
    recipients?: string[];
    isActive?: boolean;
    lastRunAt?: Date;
    nextRunAt?: Date;
  }
): Promise<AnalyticsReportSchedule | null> {
  // Build the SET clause dynamically based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.frequency !== undefined) {
    updates.push(`frequency = $${paramIndex++}`);
    values.push(data.frequency);
  }
  
  if (data.dayOfWeek !== undefined) {
    updates.push(`day_of_week = $${paramIndex++}`);
    values.push(data.dayOfWeek);
  }
  
  if (data.dayOfMonth !== undefined) {
    updates.push(`day_of_month = $${paramIndex++}`);
    values.push(data.dayOfMonth);
  }
  
  if (data.timeOfDay !== undefined) {
    updates.push(`time_of_day = $${paramIndex++}`);
    values.push(data.timeOfDay);
  }
  
  if (data.format !== undefined) {
    updates.push(`format = $${paramIndex++}`);
    values.push(data.format);
  }
  
  if (data.recipients !== undefined) {
    updates.push(`recipients = $${paramIndex++}`);
    values.push(data.recipients);
  }
  
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }
  
  if (data.lastRunAt !== undefined) {
    updates.push(`last_run_at = $${paramIndex++}`);
    values.push(data.lastRunAt);
  }
  
  if (data.nextRunAt !== undefined) {
    updates.push(`next_run_at = $${paramIndex++}`);
    values.push(data.nextRunAt);
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = NOW()`);
  
  // If no fields to update, return the existing schedule
  if (updates.length === 1) {
    return getReportScheduleById(id);
  }
  
  // Add the ID as the last parameter
  values.push(id);
  
  const result = await db.query(
    `UPDATE analytics_report_schedules 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAnalyticsReportScheduleFromDb(result.rows[0]);
}

/**
 * Delete report schedule
 */
export async function deleteReportSchedule(id: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM analytics_report_schedules WHERE id = $1 RETURNING id`,
    [id]
  );
  
  return result.rows.length > 0;
}

/**
 * Create a report execution record
 */
export async function createReportExecution(
  reportId: string,
  scheduleId: string | null,
  parameters: Record<string, any> | null,
  createdBy: string | null
): Promise<AnalyticsReportExecution> {
  const id = uuidv4();
  
  const result = await db.query(
    `INSERT INTO analytics_report_executions (
      id, report_id, schedule_id, parameters, status, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [id, reportId, scheduleId, parameters, 'pending', createdBy]
  );
  
  return mapAnalyticsReportExecutionFromDb(result.rows[0]);
}

/**
 * Update report execution status
 */
export async function updateReportExecutionStatus(
  id: string,
  status: 'pending' | 'running' | 'completed' | 'failed',
  resultFilePath?: string,
  errorMessage?: string
): Promise<AnalyticsReportExecution | null> {
  const updates: string[] = ['status = $1'];
  const values: any[] = [status];
  let paramIndex = 2;
  
  if (resultFilePath !== undefined) {
    updates.push(`result_file_path = $${paramIndex++}`);
    values.push(resultFilePath);
  }
  
  if (errorMessage !== undefined) {
    updates.push(`error_message = $${paramIndex++}`);
    values.push(errorMessage);
  }
  
  if (status === 'completed' || status === 'failed') {
    updates.push(`completed_at = NOW()`);
  }
  
  values.push(id);
  
  const result = await db.query(
    `UPDATE analytics_report_executions 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapAnalyticsReportExecutionFromDb(result.rows[0]);
}

/**
 * Get report executions by report ID
 */
export async function getReportExecutionsByReportId(
  reportId: string,
  limit: number = 10
): Promise<AnalyticsReportExecution[]> {
  const result = await db.query(
    `SELECT * FROM analytics_report_executions 
     WHERE report_id = $1
     ORDER BY started_at DESC
     LIMIT $2`,
    [reportId, limit]
  );
  
  return result.rows.map(mapAnalyticsReportExecutionFromDb);
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRunTime(
  frequency: ReportFrequency,
  timeOfDay: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  const now = new Date();
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  
  // Set the time component
  const result = new Date(now);
  result.setHours(hours, minutes, 0, 0);
  
  // If the time is in the past, move to the next occurrence
  if (result <= now) {
    result.setDate(result.getDate() + 1);
  }
  
  // Adjust based on frequency
  switch (frequency) {
    case ReportFrequency.DAILY:
      // Already set correctly
      break;
      
    case ReportFrequency.WEEKLY:
      if (dayOfWeek !== undefined) {
        // Move to the next occurrence of the specified day of week
        const currentDay = result.getDay();
        const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
        result.setDate(result.getDate() + daysToAdd);
      }
      break;
      
    case ReportFrequency.MONTHLY:
      if (dayOfMonth !== undefined) {
        // Move to the specified day of the month
        result.setDate(dayOfMonth);
        // If the resulting date is in the past, move to next month
        if (result <= now) {
          result.setMonth(result.getMonth() + 1);
        }
      }
      break;
      
    case ReportFrequency.QUARTERLY:
      if (dayOfMonth !== undefined) {
        // Move to the specified day of the month
        result.setDate(dayOfMonth);
        
        // Calculate the next quarter month
        const currentMonth = now.getMonth();
        const currentQuarter = Math.floor(currentMonth / 3);
        const nextQuarterStartMonth = (currentQuarter + 1) * 3;
        
        result.setMonth(nextQuarterStartMonth);
        
        // If the resulting date is in the past, move to next quarter
        if (result <= now) {
          result.setMonth(result.getMonth() + 3);
        }
      }
      break;
  }
  
  return result;
}
