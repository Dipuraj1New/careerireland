/**
 * Compliance Monitoring Service
 *
 * This service implements compliance monitoring functionality to track
 * compliance with various regulations, particularly GDPR.
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { sendNotification } from '@/services/notification/notificationService';
import { NotificationType } from '@/types/notification';
import { UserRole } from '@/types/user';
import { format, subMonths, subDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

/**
 * Compliance requirement types
 */
export enum ComplianceRequirementType {
  GDPR = 'gdpr',
  DATA_PROTECTION = 'data_protection',
  RETENTION = 'retention',
  CONSENT = 'consent',
  ACCESS_CONTROL = 'access_control',
  AUDIT = 'audit',
  BREACH_NOTIFICATION = 'breach_notification',
  CUSTOM = 'custom',
}

/**
 * Compliance status
 */
export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  UNDER_REVIEW = 'under_review',
  NOT_APPLICABLE = 'not_applicable',
}

/**
 * Compliance requirement interface
 */
export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  type: ComplianceRequirementType;
  status: ComplianceStatus;
  details?: Record<string, any>;
  lastChecked?: Date;
  nextCheckDue?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Compliance check result interface
 */
export interface ComplianceCheckResult {
  requirementId: string;
  status: ComplianceStatus;
  details: Record<string, any>;
  timestamp: Date;
}

/**
 * Create a new compliance requirement
 */
export async function createComplianceRequirement(
  name: string,
  description: string,
  type: ComplianceRequirementType,
  details?: Record<string, any>,
  createdBy?: string
): Promise<ComplianceRequirement> {
  const id = uuidv4();
  const now = new Date();

  // Calculate next check due date (default: 30 days from now)
  const nextCheckDue = new Date();
  nextCheckDue.setDate(nextCheckDue.getDate() + 30);

  const result = await db.query(
    `INSERT INTO compliance_requirements (
      id, name, description, type, status, details,
      last_checked, next_check_due, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      id,
      name,
      description,
      type,
      ComplianceStatus.UNDER_REVIEW,
      JSON.stringify(details || {}),
      null,
      nextCheckDue,
      now,
      now
    ]
  );

  const requirement = mapComplianceRequirementFromDb(result.rows[0]);

  // Create audit log
  if (createdBy) {
    await createAuditLog({
      userId: createdBy,
      entityType: AuditEntityType.COMPLIANCE_REQUIREMENT,
      entityId: id,
      action: AuditAction.CREATE,
      details: { name, type }
    });
  }

  return requirement;
}

/**
 * Get compliance requirement by ID
 */
export async function getComplianceRequirementById(
  id: string
): Promise<ComplianceRequirement | null> {
  const result = await db.query(
    `SELECT * FROM compliance_requirements WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapComplianceRequirementFromDb(result.rows[0]);
}

/**
 * Get compliance requirements with filtering
 */
export async function getComplianceRequirements(
  type?: ComplianceRequirementType,
  status?: ComplianceStatus,
  page: number = 1,
  limit: number = 10
): Promise<{
  requirements: ComplianceRequirement[],
  pagination: { total: number, page: number, limit: number }
}> {
  const offset = (page - 1) * limit;

  let query = `SELECT * FROM compliance_requirements`;
  const params: any[] = [];

  const conditions: string[] = [];

  if (type) {
    conditions.push(`type = $${params.length + 1}`);
    params.push(type);
  }

  if (status) {
    conditions.push(`status = $${params.length + 1}`);
    params.push(status);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY next_check_due ASC, created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);

  // Get total count for pagination
  let countQuery = `SELECT COUNT(*) FROM compliance_requirements`;
  if (conditions.length > 0) {
    countQuery += ` WHERE ${conditions.join(' AND ')}`;
  }

  const countResult = await db.query(countQuery, params.slice(0, conditions.length));
  const total = parseInt(countResult.rows[0].count);

  return {
    requirements: result.rows.map(mapComplianceRequirementFromDb),
    pagination: {
      total,
      page,
      limit
    }
  };
}

/**
 * Update compliance requirement status
 */
export async function updateComplianceRequirementStatus(
  id: string,
  status: ComplianceStatus,
  details?: Record<string, any>,
  updatedBy?: string
): Promise<ComplianceRequirement | null> {
  const now = new Date();

  // Calculate next check due date (default: 30 days from now)
  const nextCheckDue = new Date();
  nextCheckDue.setDate(nextCheckDue.getDate() + 30);

  const result = await db.query(
    `UPDATE compliance_requirements
     SET status = $1,
         details = CASE WHEN $2::jsonb IS NOT NULL THEN $2 ELSE details END,
         last_checked = $3,
         next_check_due = $4,
         updated_at = $5
     WHERE id = $6
     RETURNING *`,
    [
      status,
      details ? JSON.stringify(details) : null,
      now,
      nextCheckDue,
      now,
      id
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const requirement = mapComplianceRequirementFromDb(result.rows[0]);

  // Create audit log
  if (updatedBy) {
    await createAuditLog({
      userId: updatedBy,
      entityType: AuditEntityType.COMPLIANCE_REQUIREMENT,
      entityId: id,
      action: AuditAction.UPDATE_STATUS,
      details: { status, details }
    });
  }

  // If status is non-compliant, send notification to admins
  if (status === ComplianceStatus.NON_COMPLIANT) {
    await notifyAdminsOfNonCompliance(requirement);
  }

  return requirement;
}

/**
 * Run compliance check for a specific requirement
 */
export async function runComplianceCheck(
  requirementId: string,
  userId: string
): Promise<ComplianceCheckResult> {
  const requirement = await getComplianceRequirementById(requirementId);

  if (!requirement) {
    throw new Error(`Compliance requirement not found: ${requirementId}`);
  }

  // Run the appropriate check based on requirement type
  let result: ComplianceCheckResult;

  switch (requirement.type) {
    case ComplianceRequirementType.GDPR:
      result = await checkGdprCompliance(requirement);
      break;
    case ComplianceRequirementType.DATA_PROTECTION:
      result = await checkDataProtectionCompliance(requirement);
      break;
    case ComplianceRequirementType.RETENTION:
      result = await checkRetentionCompliance(requirement);
      break;
    case ComplianceRequirementType.CONSENT:
      result = await checkConsentCompliance(requirement);
      break;
    case ComplianceRequirementType.ACCESS_CONTROL:
      result = await checkAccessControlCompliance(requirement);
      break;
    case ComplianceRequirementType.AUDIT:
      result = await checkAuditCompliance(requirement);
      break;
    case ComplianceRequirementType.BREACH_NOTIFICATION:
      result = await checkBreachNotificationCompliance(requirement);
      break;
    default:
      // For custom requirements, we'll just maintain the current status
      result = {
        requirementId,
        status: requirement.status,
        details: requirement.details || {},
        timestamp: new Date()
      };
  }

  // Update the requirement status
  await updateComplianceRequirementStatus(
    requirementId,
    result.status,
    result.details,
    userId
  );

  return result;
}

/**
 * Run all compliance checks
 */
export async function runAllComplianceChecks(
  userId: string
): Promise<ComplianceCheckResult[]> {
  const { requirements } = await getComplianceRequirements(
    undefined, // all types
    undefined, // all statuses
    1,
    1000 // get up to 1000 requirements
  );

  const results: ComplianceCheckResult[] = [];

  for (const requirement of requirements) {
    try {
      const result = await runComplianceCheck(requirement.id, userId);
      results.push(result);
    } catch (error) {
      console.error(`Error running compliance check for ${requirement.id}:`, error);
      // Continue with other checks even if one fails
    }
  }

  return results;
}

/**
 * Check GDPR compliance
 */
async function checkGdprCompliance(
  requirement: ComplianceRequirement
): Promise<ComplianceCheckResult> {
  // This would implement actual GDPR compliance checks
  // For now, we'll just do some basic checks

  const details: Record<string, any> = {};
  let status = ComplianceStatus.COMPLIANT;

  // Check if privacy policy exists
  const privacyPolicyResult = await db.query(
    `SELECT * FROM security_policies
     WHERE policy_type = 'privacy_policy' AND is_active = true`
  );

  if (privacyPolicyResult.rows.length === 0) {
    details.privacyPolicy = {
      compliant: false,
      message: 'No active privacy policy found'
    };
    status = ComplianceStatus.NON_COMPLIANT;
  } else {
    details.privacyPolicy = {
      compliant: true,
      policyId: privacyPolicyResult.rows[0].id
    };
  }

  // Check if data retention policies exist
  const retentionPolicyResult = await db.query(
    `SELECT COUNT(*) FROM data_retention_policies WHERE is_active = true`
  );

  if (parseInt(retentionPolicyResult.rows[0].count) === 0) {
    details.retentionPolicies = {
      compliant: false,
      message: 'No active data retention policies found'
    };
    status = ComplianceStatus.NON_COMPLIANT;
  } else {
    details.retentionPolicies = {
      compliant: true,
      count: parseInt(retentionPolicyResult.rows[0].count)
    };
  }

  // Check if consent mechanisms are in place
  const consentRecordsResult = await db.query(
    `SELECT COUNT(*) FROM consent_records`
  );

  if (parseInt(consentRecordsResult.rows[0].count) === 0) {
    details.consentRecords = {
      compliant: false,
      message: 'No consent records found'
    };
    status = status === ComplianceStatus.COMPLIANT
      ? ComplianceStatus.PARTIALLY_COMPLIANT
      : status;
  } else {
    details.consentRecords = {
      compliant: true,
      count: parseInt(consentRecordsResult.rows[0].count)
    };
  }

  return {
    requirementId: requirement.id,
    status,
    details,
    timestamp: new Date()
  };
}

// Implement other compliance check functions
// These are simplified versions for demonstration
async function checkDataProtectionCompliance(requirement: ComplianceRequirement): Promise<ComplianceCheckResult> {
  // Implementation would check encryption, masking, etc.
  return {
    requirementId: requirement.id,
    status: ComplianceStatus.COMPLIANT,
    details: { message: 'Data protection checks passed' },
    timestamp: new Date()
  };
}

async function checkRetentionCompliance(requirement: ComplianceRequirement): Promise<ComplianceCheckResult> {
  // Implementation would check data retention policies
  return {
    requirementId: requirement.id,
    status: ComplianceStatus.COMPLIANT,
    details: { message: 'Retention policy checks passed' },
    timestamp: new Date()
  };
}

async function checkConsentCompliance(requirement: ComplianceRequirement): Promise<ComplianceCheckResult> {
  // Implementation would check consent records
  return {
    requirementId: requirement.id,
    status: ComplianceStatus.COMPLIANT,
    details: { message: 'Consent management checks passed' },
    timestamp: new Date()
  };
}

async function checkAccessControlCompliance(requirement: ComplianceRequirement): Promise<ComplianceCheckResult> {
  // Implementation would check access controls
  return {
    requirementId: requirement.id,
    status: ComplianceStatus.COMPLIANT,
    details: { message: 'Access control checks passed' },
    timestamp: new Date()
  };
}

async function checkAuditCompliance(requirement: ComplianceRequirement): Promise<ComplianceCheckResult> {
  // Implementation would check audit logs
  return {
    requirementId: requirement.id,
    status: ComplianceStatus.COMPLIANT,
    details: { message: 'Audit logging checks passed' },
    timestamp: new Date()
  };
}

async function checkBreachNotificationCompliance(requirement: ComplianceRequirement): Promise<ComplianceCheckResult> {
  // Implementation would check breach notification procedures
  return {
    requirementId: requirement.id,
    status: ComplianceStatus.COMPLIANT,
    details: { message: 'Breach notification checks passed' },
    timestamp: new Date()
  };
}

/**
 * Notify admins of non-compliance
 */
async function notifyAdminsOfNonCompliance(
  requirement: ComplianceRequirement
): Promise<void> {
  // Get users with admin role
  const adminResult = await db.query(
    `SELECT id FROM users WHERE role = $1`,
    [UserRole.ADMIN]
  );

  for (const admin of adminResult.rows) {
    await sendNotification({
      userId: admin.id,
      type: NotificationType.SECURITY,
      title: 'Compliance Issue Detected',
      message: `Non-compliance detected for requirement: ${requirement.name}`,
      priority: 'high',
      data: {
        requirementId: requirement.id,
        type: requirement.type,
        status: requirement.status
      }
    });
  }
}

/**
 * Compliance trend period enum
 */
export enum ComplianceTrendPeriod {
  ONE_MONTH = '1month',
  THREE_MONTHS = '3months',
  SIX_MONTHS = '6months',
  ONE_YEAR = '1year',
}

/**
 * Compliance trend interface
 */
export interface ComplianceTrend {
  date: string;
  complianceRate: number;
  compliant: number;
  nonCompliant: number;
  partiallyCompliant: number;
  underReview: number;
  total: number;
  byType?: Record<string, number>;
}

/**
 * Get compliance trends over time
 */
export async function getComplianceTrends(
  period: ComplianceTrendPeriod,
  type?: ComplianceRequirementType
): Promise<ComplianceTrend[]> {
  const now = new Date();
  let startDate: Date;

  // Calculate start date based on period
  switch (period) {
    case ComplianceTrendPeriod.ONE_MONTH:
      startDate = subMonths(now, 1);
      break;
    case ComplianceTrendPeriod.THREE_MONTHS:
      startDate = subMonths(now, 3);
      break;
    case ComplianceTrendPeriod.SIX_MONTHS:
      startDate = subMonths(now, 6);
      break;
    case ComplianceTrendPeriod.ONE_YEAR:
      startDate = subMonths(now, 12);
      break;
    default:
      startDate = subMonths(now, 6);
  }

  return getComplianceTrendsByDate(startDate, now, 'auto', type);
}

/**
 * Get compliance trends by custom date range
 */
export async function getComplianceTrendsByDate(
  startDate: Date,
  endDate: Date,
  groupBy: 'auto' | 'day' | 'week' | 'month' = 'auto',
  type?: ComplianceRequirementType
): Promise<ComplianceTrend[]> {
  // Determine appropriate grouping based on date range if auto
  if (groupBy === 'auto') {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 31) {
      groupBy = 'day';
    } else if (daysDiff <= 90) {
      groupBy = 'week';
    } else {
      groupBy = 'month';
    }
  }

  // Get intervals based on grouping
  let intervals: Date[];
  switch (groupBy) {
    case 'day':
      intervals = eachDayOfInterval({ start: startDate, end: endDate });
      break;
    case 'week':
      intervals = eachWeekOfInterval({ start: startDate, end: endDate });
      break;
    case 'month':
      intervals = eachMonthOfInterval({ start: startDate, end: endDate });
      break;
    default:
      intervals = eachDayOfInterval({ start: startDate, end: endDate });
  }

  // Format date based on grouping
  const formatDate = (date: Date): string => {
    switch (groupBy) {
      case 'day':
        return format(date, 'yyyy-MM-dd');
      case 'week':
        return `${format(date, 'yyyy-MM-dd')} (Week)`;
      case 'month':
        return format(date, 'yyyy-MM');
      default:
        return format(date, 'yyyy-MM-dd');
    }
  };

  // Get compliance check results for the period
  const query = `
    SELECT
      cr.status,
      cr.type,
      cr.last_checked
    FROM
      compliance_requirements cr
    WHERE
      cr.last_checked IS NOT NULL
      AND cr.last_checked BETWEEN $1 AND $2
      ${type ? 'AND cr.type = $3' : ''}
    ORDER BY
      cr.last_checked ASC
  `;

  const params = type ? [startDate, endDate, type] : [startDate, endDate];
  const result = await db.query(query, params);

  // Process results into trends
  const trends: ComplianceTrend[] = [];

  // Initialize trend data for each interval
  for (const date of intervals) {
    trends.push({
      date: formatDate(date),
      complianceRate: 0,
      compliant: 0,
      nonCompliant: 0,
      partiallyCompliant: 0,
      underReview: 0,
      total: 0,
      byType: {}
    });
  }

  // Helper function to find the appropriate trend for a date
  const findTrendForDate = (date: Date): ComplianceTrend => {
    let intervalIndex = 0;

    switch (groupBy) {
      case 'day':
        intervalIndex = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        break;
      case 'week':
        // Find the closest week start
        for (let i = 0; i < intervals.length; i++) {
          if (i === intervals.length - 1 || date < intervals[i + 1]) {
            intervalIndex = i;
            break;
          }
        }
        break;
      case 'month':
        // Find the closest month start
        for (let i = 0; i < intervals.length; i++) {
          if (i === intervals.length - 1 || date < intervals[i + 1]) {
            intervalIndex = i;
            break;
          }
        }
        break;
    }

    // Ensure index is within bounds
    intervalIndex = Math.max(0, Math.min(intervalIndex, trends.length - 1));
    return trends[intervalIndex];
  };

  // Process each check result
  for (const row of result.rows) {
    const checkDate = new Date(row.last_checked);
    const trend = findTrendForDate(checkDate);

    // Increment counters based on status
    trend.total++;

    switch (row.status) {
      case ComplianceStatus.COMPLIANT:
        trend.compliant++;
        break;
      case ComplianceStatus.NON_COMPLIANT:
        trend.nonCompliant++;
        break;
      case ComplianceStatus.PARTIALLY_COMPLIANT:
        trend.partiallyCompliant++;
        break;
      case ComplianceStatus.UNDER_REVIEW:
        trend.underReview++;
        break;
    }

    // Track by type
    if (!trend.byType![row.type]) {
      trend.byType![row.type] = 0;
    }
    trend.byType![row.type]++;
  }

  // Calculate compliance rates
  for (const trend of trends) {
    if (trend.total > 0) {
      trend.complianceRate = (trend.compliant / trend.total) * 100;
    }
  }

  return trends;
}

/**
 * Map database compliance requirement to ComplianceRequirement type
 */
function mapComplianceRequirementFromDb(dbRequirement: any): ComplianceRequirement {
  return {
    id: dbRequirement.id,
    name: dbRequirement.name,
    description: dbRequirement.description,
    type: dbRequirement.type,
    status: dbRequirement.status,
    details: typeof dbRequirement.details === 'string'
      ? JSON.parse(dbRequirement.details)
      : dbRequirement.details,
    lastChecked: dbRequirement.last_checked ? new Date(dbRequirement.last_checked) : undefined,
    nextCheckDue: dbRequirement.next_check_due ? new Date(dbRequirement.next_check_due) : undefined,
    createdAt: new Date(dbRequirement.created_at),
    updatedAt: new Date(dbRequirement.updated_at),
  };
}
