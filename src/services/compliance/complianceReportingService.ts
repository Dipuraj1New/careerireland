/**
 * Compliance Reporting Service
 * 
 * This service implements compliance reporting functionality to generate
 * reports for compliance status and auditing purposes.
 */
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { sendEmail } from '@/services/communication/emailService';
import { 
  ComplianceRequirementType, 
  ComplianceStatus,
  getComplianceRequirements
} from './complianceMonitoringService';

/**
 * Report format
 */
export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html',
}

/**
 * Report type
 */
export enum ReportType {
  COMPLIANCE_SUMMARY = 'compliance_summary',
  GDPR_COMPLIANCE = 'gdpr_compliance',
  DATA_PROTECTION = 'data_protection',
  CONSENT_MANAGEMENT = 'consent_management',
  ACCESS_CONTROL = 'access_control',
  AUDIT_LOG = 'audit_log',
  CUSTOM = 'custom',
}

/**
 * Compliance report interface
 */
export interface ComplianceReport {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  parameters?: Record<string, any>;
  filePath?: string;
  fileSize?: number;
  generatedAt: Date;
  generatedBy: string;
  createdAt: Date;
}

/**
 * Generate a compliance report
 */
export async function generateComplianceReport(
  name: string,
  type: ReportType,
  format: ReportFormat,
  userId: string,
  parameters?: Record<string, any>,
  description?: string
): Promise<ComplianceReport> {
  const id = uuidv4();
  const now = new Date();
  
  // Generate the report content
  const reportContent = await generateReportContent(type, format, parameters);
  
  // Save the report to a file
  const fileName = `${type}_${now.getTime()}.${format.toLowerCase()}`;
  const filePath = path.join('reports', 'compliance', fileName);
  const fullPath = path.join(process.cwd(), 'public', filePath);
  
  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write the file
  fs.writeFileSync(fullPath, reportContent);
  
  // Get file size
  const stats = fs.statSync(fullPath);
  const fileSize = stats.size;
  
  // Save report metadata to database
  const result = await db.query(
    `INSERT INTO compliance_reports (
      id, name, description, type, format, parameters, 
      file_path, file_size, generated_at, generated_by, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      id,
      name,
      description || null,
      type,
      format,
      JSON.stringify(parameters || {}),
      filePath,
      fileSize,
      now,
      userId,
      now
    ]
  );
  
  const report = mapComplianceReportFromDb(result.rows[0]);
  
  // Create audit log
  await createAuditLog({
    userId,
    entityType: AuditEntityType.COMPLIANCE_REPORT,
    entityId: id,
    action: AuditAction.CREATE,
    details: { name, type, format }
  });
  
  return report;
}

/**
 * Get compliance report by ID
 */
export async function getComplianceReportById(
  id: string
): Promise<ComplianceReport | null> {
  const result = await db.query(
    `SELECT * FROM compliance_reports WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapComplianceReportFromDb(result.rows[0]);
}

/**
 * Get compliance reports with filtering
 */
export async function getComplianceReports(
  type?: ReportType,
  page: number = 1,
  limit: number = 10
): Promise<{ 
  reports: ComplianceReport[], 
  pagination: { total: number, page: number, limit: number } 
}> {
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM compliance_reports`;
  const params: any[] = [];
  
  if (type) {
    query += ` WHERE type = $1`;
    params.push(type);
  }
  
  query += ` ORDER BY generated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await db.query(query, params);
  
  // Get total count for pagination
  let countQuery = `SELECT COUNT(*) FROM compliance_reports`;
  if (type) {
    countQuery += ` WHERE type = $1`;
  }
  
  const countResult = await db.query(countQuery, type ? [type] : []);
  const total = parseInt(countResult.rows[0].count);
  
  return {
    reports: result.rows.map(mapComplianceReportFromDb),
    pagination: {
      total,
      page,
      limit
    }
  };
}

/**
 * Send compliance report by email
 */
export async function sendComplianceReportByEmail(
  reportId: string,
  recipients: string[],
  subject?: string,
  message?: string
): Promise<boolean> {
  const report = await getComplianceReportById(reportId);
  
  if (!report || !report.filePath) {
    return false;
  }
  
  const fullPath = path.join(process.cwd(), 'public', report.filePath);
  
  if (!fs.existsSync(fullPath)) {
    return false;
  }
  
  // Send email with attachment
  for (const recipient of recipients) {
    await sendEmail({
      to: recipient,
      subject: subject || `Compliance Report: ${report.name}`,
      text: message || `Please find attached the compliance report "${report.name}" generated on ${report.generatedAt.toLocaleDateString()}.`,
      html: message ? `<p>${message}</p>` : `<p>Please find attached the compliance report "${report.name}" generated on ${report.generatedAt.toLocaleDateString()}.</p>`,
      attachments: [
        {
          filename: path.basename(report.filePath),
          path: fullPath
        }
      ]
    });
  }
  
  return true;
}

/**
 * Schedule a recurring compliance report
 */
export async function scheduleComplianceReport(
  name: string,
  type: ReportType,
  format: ReportFormat,
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
  recipients: string[],
  userId: string,
  parameters?: Record<string, any>,
  description?: string
): Promise<any> {
  const id = uuidv4();
  const now = new Date();
  
  // Calculate next run date based on frequency
  const nextRunDate = calculateNextRunDate(frequency);
  
  // Save schedule to database
  const result = await db.query(
    `INSERT INTO compliance_report_schedules (
      id, name, description, type, format, parameters, 
      frequency, recipients, next_run_date, created_by, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      id,
      name,
      description || null,
      type,
      format,
      JSON.stringify(parameters || {}),
      frequency,
      JSON.stringify(recipients),
      nextRunDate,
      userId,
      now
    ]
  );
  
  const schedule = result.rows[0];
  
  // Create audit log
  await createAuditLog({
    userId,
    entityType: AuditEntityType.COMPLIANCE_REPORT_SCHEDULE,
    entityId: id,
    action: AuditAction.CREATE,
    details: { name, type, format, frequency }
  });
  
  return {
    id: schedule.id,
    name: schedule.name,
    description: schedule.description,
    type: schedule.type,
    format: schedule.format,
    frequency: schedule.frequency,
    nextRunDate: new Date(schedule.next_run_date),
    createdAt: new Date(schedule.created_at)
  };
}

/**
 * Generate report content based on type and format
 */
async function generateReportContent(
  type: ReportType,
  format: ReportFormat,
  parameters?: Record<string, any>
): Promise<string> {
  // Get the data for the report
  const data = await getReportData(type, parameters);
  
  // Format the data based on the requested format
  switch (format) {
    case ReportFormat.JSON:
      return JSON.stringify(data, null, 2);
    case ReportFormat.CSV:
      return convertToCSV(data);
    case ReportFormat.HTML:
      return convertToHTML(data, type);
    case ReportFormat.PDF:
      // In a real implementation, you would generate a PDF
      // For now, we'll just return HTML that could be converted to PDF
      return convertToHTML(data, type);
    default:
      return JSON.stringify(data, null, 2);
  }
}

/**
 * Get report data based on type
 */
async function getReportData(
  type: ReportType,
  parameters?: Record<string, any>
): Promise<any> {
  switch (type) {
    case ReportType.COMPLIANCE_SUMMARY:
      return await getComplianceSummaryData();
    case ReportType.GDPR_COMPLIANCE:
      return await getGdprComplianceData();
    case ReportType.DATA_PROTECTION:
      return await getDataProtectionData();
    case ReportType.CONSENT_MANAGEMENT:
      return await getConsentManagementData();
    case ReportType.ACCESS_CONTROL:
      return await getAccessControlData();
    case ReportType.AUDIT_LOG:
      return await getAuditLogData(parameters);
    case ReportType.CUSTOM:
      // For custom reports, parameters should specify what data to include
      return await getCustomReportData(parameters);
    default:
      return { error: 'Unknown report type' };
  }
}

/**
 * Get compliance summary data
 */
async function getComplianceSummaryData(): Promise<any> {
  // Get all compliance requirements
  const { requirements } = await getComplianceRequirements(
    undefined, // all types
    undefined, // all statuses
    1,
    1000 // get up to 1000 requirements
  );
  
  // Calculate summary statistics
  const totalRequirements = requirements.length;
  const compliantCount = requirements.filter(r => r.status === ComplianceStatus.COMPLIANT).length;
  const nonCompliantCount = requirements.filter(r => r.status === ComplianceStatus.NON_COMPLIANT).length;
  const partiallyCompliantCount = requirements.filter(r => r.status === ComplianceStatus.PARTIALLY_COMPLIANT).length;
  const underReviewCount = requirements.filter(r => r.status === ComplianceStatus.UNDER_REVIEW).length;
  
  // Group by type
  const byType: Record<string, any> = {};
  for (const req of requirements) {
    if (!byType[req.type]) {
      byType[req.type] = {
        total: 0,
        compliant: 0,
        nonCompliant: 0,
        partiallyCompliant: 0,
        underReview: 0
      };
    }
    
    byType[req.type].total++;
    
    if (req.status === ComplianceStatus.COMPLIANT) {
      byType[req.type].compliant++;
    } else if (req.status === ComplianceStatus.NON_COMPLIANT) {
      byType[req.type].nonCompliant++;
    } else if (req.status === ComplianceStatus.PARTIALLY_COMPLIANT) {
      byType[req.type].partiallyCompliant++;
    } else if (req.status === ComplianceStatus.UNDER_REVIEW) {
      byType[req.type].underReview++;
    }
  }
  
  // Get upcoming checks
  const upcomingChecks = requirements
    .filter(r => r.nextCheckDue)
    .sort((a, b) => {
      if (!a.nextCheckDue || !b.nextCheckDue) return 0;
      return a.nextCheckDue.getTime() - b.nextCheckDue.getTime();
    })
    .slice(0, 10);
  
  return {
    summary: {
      totalRequirements,
      compliantCount,
      nonCompliantCount,
      partiallyCompliantCount,
      underReviewCount,
      complianceRate: totalRequirements > 0 
        ? (compliantCount / totalRequirements) * 100 
        : 0
    },
    byType,
    upcomingChecks: upcomingChecks.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      status: r.status,
      nextCheckDue: r.nextCheckDue
    })),
    nonCompliantRequirements: requirements
      .filter(r => r.status === ComplianceStatus.NON_COMPLIANT)
      .map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        details: r.details
      }))
  };
}

// Implement other data gathering functions
// These are simplified versions for demonstration
async function getGdprComplianceData(): Promise<any> {
  // Implementation would gather GDPR-specific compliance data
  return { message: 'GDPR compliance data would be gathered here' };
}

async function getDataProtectionData(): Promise<any> {
  // Implementation would gather data protection compliance data
  return { message: 'Data protection data would be gathered here' };
}

async function getConsentManagementData(): Promise<any> {
  // Implementation would gather consent management data
  return { message: 'Consent management data would be gathered here' };
}

async function getAccessControlData(): Promise<any> {
  // Implementation would gather access control data
  return { message: 'Access control data would be gathered here' };
}

async function getAuditLogData(parameters?: Record<string, any>): Promise<any> {
  // Implementation would gather audit log data
  return { message: 'Audit log data would be gathered here', parameters };
}

async function getCustomReportData(parameters?: Record<string, any>): Promise<any> {
  // Implementation would gather custom report data based on parameters
  return { message: 'Custom report data would be gathered here', parameters };
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any): string {
  // Simple implementation for demonstration
  // In a real application, you would use a proper CSV library
  
  if (!data || typeof data !== 'object') {
    return '';
  }
  
  // If data is an array of objects, convert each object to a row
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return '';
    }
    
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create header row
    let csv = headers.join(',') + '\n';
    
    // Create data rows
    for (const item of data) {
      const row = headers.map(header => {
        const value = item[header];
        // Handle different types of values
        if (value === null || value === undefined) {
          return '';
        } else if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } else {
          return `"${String(value).replace(/"/g, '""')}"`;
        }
      }).join(',');
      
      csv += row + '\n';
    }
    
    return csv;
  }
  
  // If data is a single object, convert it to a two-column format
  const rows = Object.entries(data).map(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      return `"${key}","${JSON.stringify(value).replace(/"/g, '""')}"`;
    } else {
      return `"${key}","${String(value).replace(/"/g, '""')}"`;
    }
  });
  
  return 'Key,Value\n' + rows.join('\n');
}

/**
 * Convert data to HTML format
 */
function convertToHTML(data: any, type: ReportType): string {
  // Simple implementation for demonstration
  // In a real application, you would use a proper HTML template engine
  
  const title = getReportTitle(type);
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
  `;
  
  // Convert data to HTML based on its structure
  if (Array.isArray(data)) {
    if (data.length === 0) {
      html += '<p>No data available.</p>';
    } else {
      // Create a table for array of objects
      const headers = Object.keys(data[0]);
      
      html += '<table><thead><tr>';
      for (const header of headers) {
        html += `<th>${header}</th>`;
      }
      html += '</tr></thead><tbody>';
      
      for (const item of data) {
        html += '<tr>';
        for (const header of headers) {
          const value = item[header];
          if (value === null || value === undefined) {
            html += '<td></td>';
          } else if (typeof value === 'object') {
            html += `<td>${JSON.stringify(value)}</td>`;
          } else {
            html += `<td>${value}</td>`;
          }
        }
        html += '</tr>';
      }
      
      html += '</tbody></table>';
    }
  } else if (typeof data === 'object' && data !== null) {
    // Create sections for nested objects
    for (const [key, value] of Object.entries(data)) {
      html += `<h2>${key}</h2>`;
      
      if (Array.isArray(value)) {
        // Create a table for array
        if (value.length > 0 && typeof value[0] === 'object') {
          const headers = Object.keys(value[0]);
          
          html += '<table><thead><tr>';
          for (const header of headers) {
            html += `<th>${header}</th>`;
          }
          html += '</tr></thead><tbody>';
          
          for (const item of value) {
            html += '<tr>';
            for (const header of headers) {
              const cellValue = item[header];
              if (cellValue === null || cellValue === undefined) {
                html += '<td></td>';
              } else if (typeof cellValue === 'object') {
                html += `<td>${JSON.stringify(cellValue)}</td>`;
              } else {
                html += `<td>${cellValue}</td>`;
              }
            }
            html += '</tr>';
          }
          
          html += '</tbody></table>';
        } else {
          // Create a simple list for array of primitives
          html += '<ul>';
          for (const item of value) {
            html += `<li>${item}</li>`;
          }
          html += '</ul>';
        }
      } else if (typeof value === 'object' && value !== null) {
        // Create a table for nested object
        html += '<table><thead><tr><th>Property</th><th>Value</th></tr></thead><tbody>';
        
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          html += '<tr>';
          html += `<td>${nestedKey}</td>`;
          
          if (nestedValue === null || nestedValue === undefined) {
            html += '<td></td>';
          } else if (typeof nestedValue === 'object') {
            html += `<td>${JSON.stringify(nestedValue)}</td>`;
          } else {
            html += `<td>${nestedValue}</td>`;
          }
          
          html += '</tr>';
        }
        
        html += '</tbody></table>';
      } else {
        // Display simple value
        html += `<p>${value}</p>`;
      }
    }
  } else {
    // Display simple value
    html += `<p>${data}</p>`;
  }
  
  html += `
    </body>
    </html>
  `;
  
  return html;
}

/**
 * Get report title based on type
 */
function getReportTitle(type: ReportType): string {
  switch (type) {
    case ReportType.COMPLIANCE_SUMMARY:
      return 'Compliance Summary Report';
    case ReportType.GDPR_COMPLIANCE:
      return 'GDPR Compliance Report';
    case ReportType.DATA_PROTECTION:
      return 'Data Protection Report';
    case ReportType.CONSENT_MANAGEMENT:
      return 'Consent Management Report';
    case ReportType.ACCESS_CONTROL:
      return 'Access Control Report';
    case ReportType.AUDIT_LOG:
      return 'Audit Log Report';
    case ReportType.CUSTOM:
      return 'Custom Compliance Report';
    default:
      return 'Compliance Report';
  }
}

/**
 * Calculate next run date based on frequency
 */
function calculateNextRunDate(frequency: string): Date {
  const now = new Date();
  
  switch (frequency) {
    case 'daily':
      // Next day, same time
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      // Next week, same day and time
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      // Next month, same day and time
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    case 'quarterly':
      // Next quarter, same day and time
      const nextQuarter = new Date(now);
      nextQuarter.setMonth(nextQuarter.getMonth() + 3);
      return nextQuarter;
    default:
      // Default to weekly
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Map database compliance report to ComplianceReport type
 */
function mapComplianceReportFromDb(dbReport: any): ComplianceReport {
  return {
    id: dbReport.id,
    name: dbReport.name,
    description: dbReport.description,
    type: dbReport.type,
    format: dbReport.format,
    parameters: typeof dbReport.parameters === 'string'
      ? JSON.parse(dbReport.parameters)
      : dbReport.parameters,
    filePath: dbReport.file_path,
    fileSize: dbReport.file_size,
    generatedAt: new Date(dbReport.generated_at),
    generatedBy: dbReport.generated_by,
    createdAt: new Date(dbReport.created_at),
  };
}
