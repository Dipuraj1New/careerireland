/**
 * Reporting Service
 * 
 * Handles report generation and scheduling
 */
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import { sendNotification } from '@/services/notification/notificationService';
import { NotificationType } from '@/types/notification';
import { sendEmail } from '@/services/communication/emailService';
import {
  AnalyticsReport,
  AnalyticsReportCreateData,
  AnalyticsReportSchedule,
  AnalyticsReportScheduleCreateData,
  AnalyticsReportExecution,
  ReportResult,
  ReportType,
  ReportFormat
} from '@/types/analytics';
import * as analyticsReportRepository from './analyticsReportRepository';

/**
 * Create a new report
 */
export async function createReport(
  data: AnalyticsReportCreateData,
  userId: string
): Promise<{ success: boolean; report?: AnalyticsReport; message?: string }> {
  try {
    // Validate the query if it's a custom report
    if (data.type === ReportType.CUSTOM && data.query) {
      try {
        // Execute the query with EXPLAIN to check if it's valid
        // This won't actually run the query, just check if it's valid
        await db.query(`EXPLAIN ${data.query}`);
      } catch (error) {
        return {
          success: false,
          message: `Invalid report query: ${error.message}`
        };
      }
    }
    
    // Create the report
    const report = await analyticsReportRepository.createAnalyticsReport({
      ...data,
      createdBy: userId
    });
    
    // Log the creation
    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.REPORT,
      entityId: report.id,
      userId,
      metadata: {
        name: report.name,
        type: report.type
      }
    });
    
    return { success: true, report };
  } catch (error) {
    console.error('Error creating report:', error);
    return {
      success: false,
      message: `Failed to create report: ${error.message}`
    };
  }
}

/**
 * Schedule a report
 */
export async function scheduleReport(
  data: AnalyticsReportScheduleCreateData,
  userId: string
): Promise<{ success: boolean; schedule?: AnalyticsReportSchedule; message?: string }> {
  try {
    // Validate that the report exists
    const report = await analyticsReportRepository.getAnalyticsReportById(data.reportId);
    if (!report) {
      return { success: false, message: 'Report not found' };
    }
    
    // Validate frequency-specific parameters
    if (data.frequency === 'weekly' && (data.dayOfWeek === undefined || data.dayOfWeek < 0 || data.dayOfWeek > 6)) {
      return { success: false, message: 'Day of week must be between 0 (Sunday) and 6 (Saturday) for weekly reports' };
    }
    
    if (data.frequency === 'monthly' && (data.dayOfMonth === undefined || data.dayOfMonth < 1 || data.dayOfMonth > 31)) {
      return { success: false, message: 'Day of month must be between 1 and 31 for monthly reports' };
    }
    
    // Create the schedule
    const schedule = await analyticsReportRepository.createReportSchedule({
      ...data,
      createdBy: userId
    });
    
    // Log the creation
    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.REPORT_SCHEDULE,
      entityId: schedule.id,
      userId,
      metadata: {
        reportId: data.reportId,
        frequency: data.frequency,
        recipients: data.recipients
      }
    });
    
    return { success: true, schedule };
  } catch (error) {
    console.error('Error scheduling report:', error);
    return {
      success: false,
      message: `Failed to schedule report: ${error.message}`
    };
  }
}

/**
 * Generate a report
 */
export async function generateReport(
  reportId: string,
  parameters: Record<string, any> = {},
  userId: string | null = null
): Promise<{ success: boolean; result?: ReportResult; message?: string }> {
  try {
    // Get the report
    const report = await analyticsReportRepository.getAnalyticsReportById(reportId);
    if (!report) {
      return { success: false, message: 'Report not found' };
    }
    
    // Create an execution record
    const execution = await analyticsReportRepository.createReportExecution(
      reportId,
      null, // Not from a schedule
      parameters,
      userId
    );
    
    // Update execution status to running
    await analyticsReportRepository.updateReportExecutionStatus(
      execution.id,
      'running'
    );
    
    try {
      // Execute the report query
      let data: any[] = [];
      
      if (report.type === ReportType.CUSTOM && report.query) {
        // For custom reports, execute the provided query
        const result = await db.query(report.query, Object.values(parameters));
        data = result.rows;
      } else if (report.type === ReportType.SYSTEM) {
        // For system reports, use predefined queries based on the report name
        // This is a simplified example
        switch (report.name) {
          case 'Case Status Summary':
            const caseStatusResult = await db.query(`
              SELECT status, COUNT(*) as count
              FROM cases
              GROUP BY status
              ORDER BY count DESC
            `);
            data = caseStatusResult.rows;
            break;
            
          case 'Document Processing Times':
            const docProcessingResult = await db.query(`
              SELECT 
                document_type,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds,
                COUNT(*) as count
              FROM documents
              WHERE status = 'processed'
              GROUP BY document_type
              ORDER BY avg_processing_time_seconds DESC
            `);
            data = docProcessingResult.rows;
            break;
            
          case 'Consultation Revenue':
            const revenueResult = await db.query(`
              SELECT 
                DATE_TRUNC('month', cp.created_at) as month,
                SUM(cp.amount) as revenue,
                COUNT(*) as count
              FROM consultation_payments cp
              WHERE cp.status = 'completed'
              GROUP BY month
              ORDER BY month DESC
            `);
            data = revenueResult.rows;
            break;
            
          default:
            throw new Error(`Unknown system report: ${report.name}`);
        }
      }
      
      // Generate a file path for the report
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${report.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;
      const filePath = `reports/${fileName}.json`; // In a real implementation, this would be a PDF, CSV, etc.
      
      // In a real implementation, you would generate the actual file here
      // For this example, we'll just simulate it
      
      // Update execution status to completed
      await analyticsReportRepository.updateReportExecutionStatus(
        execution.id,
        'completed',
        filePath
      );
      
      // Log the report generation
      await createAuditLog({
        action: AuditAction.GENERATE,
        entityType: AuditEntityType.REPORT,
        entityId: reportId,
        userId: userId || 'system',
        metadata: {
          executionId: execution.id,
          parameters,
          rowCount: data.length
        }
      });
      
      const result: ReportResult = {
        report,
        data,
        executionId: execution.id,
        executedAt: new Date()
      };
      
      return { success: true, result };
    } catch (error) {
      // Update execution status to failed
      await analyticsReportRepository.updateReportExecutionStatus(
        execution.id,
        'failed',
        undefined,
        error.message
      );
      
      throw error;
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      success: false,
      message: `Failed to generate report: ${error.message}`
    };
  }
}

/**
 * Process scheduled reports
 */
export async function processScheduledReports(): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  message?: string;
}> {
  try {
    // Get schedules due for execution
    const schedules = await analyticsReportRepository.getSchedulesDueForExecution();
    
    let processed = 0;
    let failed = 0;
    
    for (const schedule of schedules) {
      try {
        // Generate the report
        const { success, result } = await generateReport(
          schedule.reportId,
          {}, // No parameters for scheduled reports
          schedule.createdBy || 'system'
        );
        
        if (success && result) {
          // Send the report to recipients
          await sendReportToRecipients(
            schedule.reportId,
            result.executionId,
            schedule.recipients,
            schedule.format
          );
          
          // Update schedule with last run time and calculate next run time
          const lastRunAt = new Date();
          const nextRunAt = calculateNextRunTime(
            schedule.frequency,
            schedule.timeOfDay,
            schedule.dayOfWeek,
            schedule.dayOfMonth
          );
          
          await analyticsReportRepository.updateReportSchedule(
            schedule.id,
            {
              lastRunAt,
              nextRunAt
            }
          );
          
          processed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error processing scheduled report ${schedule.id}:`, error);
        failed++;
      }
    }
    
    return {
      success: true,
      processed,
      failed,
      message: `Processed ${processed} scheduled reports, ${failed} failed`
    };
  } catch (error) {
    console.error('Error processing scheduled reports:', error);
    return {
      success: false,
      processed: 0,
      failed: 0,
      message: `Failed to process scheduled reports: ${error.message}`
    };
  }
}

/**
 * Send report to recipients
 */
async function sendReportToRecipients(
  reportId: string,
  executionId: string,
  recipients: string[],
  format: ReportFormat
): Promise<void> {
  // Get the report
  const report = await analyticsReportRepository.getAnalyticsReportById(reportId);
  if (!report) {
    throw new Error('Report not found');
  }
  
  // Get the execution
  const execution = await analyticsReportRepository.updateReportExecutionStatus(
    executionId,
    'completed'
  );
  if (!execution) {
    throw new Error('Report execution not found');
  }
  
  // In a real implementation, you would generate the report in the specified format
  // and attach it to an email
  
  // For this example, we'll just simulate sending the email
  for (const recipient of recipients) {
    await sendEmail({
      to: recipient,
      subject: `Report: ${report.name}`,
      text: `Your scheduled report "${report.name}" is attached.`,
      html: `<p>Your scheduled report "${report.name}" is attached.</p>`,
      attachments: [
        {
          filename: `${report.name}.${format.toLowerCase()}`,
          path: execution.resultFilePath || ''
        }
      ]
    });
  }
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRunTime(
  frequency: string,
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
    case 'daily':
      // Already set correctly
      break;
      
    case 'weekly':
      if (dayOfWeek !== undefined) {
        // Move to the next occurrence of the specified day of week
        const currentDay = result.getDay();
        const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
        result.setDate(result.getDate() + daysToAdd);
      }
      break;
      
    case 'monthly':
      if (dayOfMonth !== undefined) {
        // Move to the specified day of the month
        result.setDate(dayOfMonth);
        // If the resulting date is in the past, move to next month
        if (result <= now) {
          result.setMonth(result.getMonth() + 1);
        }
      }
      break;
      
    case 'quarterly':
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
