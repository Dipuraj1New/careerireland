import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { 
  SecurityPolicy, 
  SecurityPolicyType,
  SecurityAlert,
  SecurityAlertType,
  SecurityAlertSeverity,
  SecurityAlertStatus,
  ConsentRecord,
  ConsentType
} from '@/types/security';

/**
 * Create a new security policy
 */
export async function createSecurityPolicy(
  name: string,
  policyType: SecurityPolicyType,
  policyData: Record<string, any>,
  description?: string,
  createdBy?: string
): Promise<SecurityPolicy> {
  const result = await db.query(
    `INSERT INTO security_policies (
      id, name, description, policy_type, policy_data, is_active, created_by, created_at, updated_at, version
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      uuidv4(),
      name,
      description || null,
      policyType,
      JSON.stringify(policyData),
      true,
      createdBy || null,
      new Date(),
      new Date(),
      1
    ]
  );
  
  return mapSecurityPolicyFromDb(result.rows[0]);
}

/**
 * Get security policy by ID
 */
export async function getSecurityPolicyById(id: string): Promise<SecurityPolicy | null> {
  const result = await db.query(
    `SELECT * FROM security_policies
     WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapSecurityPolicyFromDb(result.rows[0]);
}

/**
 * Get active security policy by type
 */
export async function getActiveSecurityPolicyByType(policyType: SecurityPolicyType): Promise<SecurityPolicy | null> {
  const result = await db.query(
    `SELECT * FROM security_policies
     WHERE policy_type = $1 AND is_active = true
     ORDER BY version DESC
     LIMIT 1`,
    [policyType]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapSecurityPolicyFromDb(result.rows[0]);
}

/**
 * Update security policy
 */
export async function updateSecurityPolicy(
  id: string,
  name?: string,
  policyData?: Record<string, any>,
  description?: string,
  isActive?: boolean
): Promise<SecurityPolicy> {
  // Get current policy
  const currentPolicy = await getSecurityPolicyById(id);
  
  if (!currentPolicy) {
    throw new Error(`Security policy not found: ${id}`);
  }
  
  // Create a new version
  const newVersion = currentPolicy.version + 1;
  
  // Deactivate the current policy
  await db.query(
    `UPDATE security_policies
     SET is_active = false
     WHERE id = $1`,
    [id]
  );
  
  // Create a new policy version
  const result = await db.query(
    `INSERT INTO security_policies (
      id, name, description, policy_type, policy_data, is_active, created_by, created_at, updated_at, version
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      uuidv4(),
      name || currentPolicy.name,
      description !== undefined ? description : currentPolicy.description,
      currentPolicy.policyType,
      policyData ? JSON.stringify(policyData) : JSON.stringify(currentPolicy.policyData),
      isActive !== undefined ? isActive : currentPolicy.isActive,
      currentPolicy.createdBy,
      new Date(),
      new Date(),
      newVersion
    ]
  );
  
  return mapSecurityPolicyFromDb(result.rows[0]);
}

/**
 * Create a security alert
 */
export async function createSecurityAlert(
  alertType: SecurityAlertType,
  severity: SecurityAlertSeverity,
  source: string,
  description: string,
  details?: Record<string, any>
): Promise<SecurityAlert> {
  const result = await db.query(
    `INSERT INTO security_alerts (
      id, alert_type, severity, source, description, details, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      uuidv4(),
      alertType,
      severity,
      source,
      description,
      details ? JSON.stringify(details) : null,
      SecurityAlertStatus.NEW,
      new Date(),
      new Date()
    ]
  );
  
  return mapSecurityAlertFromDb(result.rows[0]);
}

/**
 * Get security alert by ID
 */
export async function getSecurityAlertById(id: string): Promise<SecurityAlert | null> {
  const result = await db.query(
    `SELECT * FROM security_alerts
     WHERE id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapSecurityAlertFromDb(result.rows[0]);
}

/**
 * Get security alerts by status
 */
export async function getSecurityAlertsByStatus(status: SecurityAlertStatus): Promise<SecurityAlert[]> {
  const result = await db.query(
    `SELECT * FROM security_alerts
     WHERE status = $1
     ORDER BY created_at DESC`,
    [status]
  );
  
  return result.rows.map(mapSecurityAlertFromDb);
}

/**
 * Update security alert status
 */
export async function updateSecurityAlertStatus(
  id: string,
  status: SecurityAlertStatus,
  resolvedBy?: string
): Promise<SecurityAlert> {
  const updates = [`status = $1`, `updated_at = $2`];
  const values = [status, new Date(), id];
  let paramIndex = 4;
  
  if (status === SecurityAlertStatus.RESOLVED && resolvedBy) {
    updates.push(`resolved_at = $3`);
    updates.push(`resolved_by = $${paramIndex++}`);
    values.splice(2, 0, new Date());
    values.push(resolvedBy);
  } else if (status === SecurityAlertStatus.RESOLVED) {
    updates.push(`resolved_at = $3`);
    values.splice(2, 0, new Date());
  }
  
  const result = await db.query(
    `UPDATE security_alerts
     SET ${updates.join(', ')}
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );
  
  return mapSecurityAlertFromDb(result.rows[0]);
}

/**
 * Record user consent
 */
export async function recordConsent(
  userId: string,
  consentType: ConsentType,
  consentVersion: string,
  isGranted: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<ConsentRecord> {
  // Check if consent record already exists
  const existingResult = await db.query(
    `SELECT * FROM consent_records
     WHERE user_id = $1 AND consent_type = $2 AND consent_version = $3
     AND revoked_at IS NULL`,
    [userId, consentType, consentVersion]
  );
  
  // If consent record exists and the grant status is the same, return it
  if (existingResult.rows.length > 0 && existingResult.rows[0].is_granted === isGranted) {
    return mapConsentRecordFromDb(existingResult.rows[0]);
  }
  
  // If consent record exists but the grant status is different, revoke it
  if (existingResult.rows.length > 0) {
    await db.query(
      `UPDATE consent_records
       SET revoked_at = NOW()
       WHERE id = $1`,
      [existingResult.rows[0].id]
    );
  }
  
  // Create a new consent record
  const result = await db.query(
    `INSERT INTO consent_records (
      id, user_id, consent_type, consent_version, is_granted, ip_address, user_agent, granted_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      uuidv4(),
      userId,
      consentType,
      consentVersion,
      isGranted,
      ipAddress || null,
      userAgent || null,
      new Date()
    ]
  );
  
  return mapConsentRecordFromDb(result.rows[0]);
}

/**
 * Get user consent status
 */
export async function getUserConsentStatus(
  userId: string,
  consentType: ConsentType,
  consentVersion?: string
): Promise<boolean | null> {
  let query = `
    SELECT * FROM consent_records
    WHERE user_id = $1 AND consent_type = $2 AND revoked_at IS NULL
  `;
  
  const params = [userId, consentType];
  
  if (consentVersion) {
    query += ` AND consent_version = $3`;
    params.push(consentVersion);
  } else {
    query += ` ORDER BY granted_at DESC LIMIT 1`;
  }
  
  const result = await db.query(query, params);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0].is_granted;
}

/**
 * Get user consent history
 */
export async function getUserConsentHistory(
  userId: string,
  consentType?: ConsentType
): Promise<ConsentRecord[]> {
  let query = `
    SELECT * FROM consent_records
    WHERE user_id = $1
  `;
  
  const params = [userId];
  
  if (consentType) {
    query += ` AND consent_type = $2`;
    params.push(consentType);
  }
  
  query += ` ORDER BY granted_at DESC`;
  
  const result = await db.query(query, params);
  
  return result.rows.map(mapConsentRecordFromDb);
}

/**
 * Map database security policy to SecurityPolicy type
 */
function mapSecurityPolicyFromDb(dbPolicy: any): SecurityPolicy {
  return {
    id: dbPolicy.id,
    name: dbPolicy.name,
    description: dbPolicy.description,
    policyType: dbPolicy.policy_type,
    policyData: typeof dbPolicy.policy_data === 'string' 
      ? JSON.parse(dbPolicy.policy_data) 
      : dbPolicy.policy_data,
    isActive: dbPolicy.is_active,
    createdBy: dbPolicy.created_by,
    createdAt: new Date(dbPolicy.created_at),
    updatedAt: new Date(dbPolicy.updated_at),
    version: dbPolicy.version,
  };
}

/**
 * Map database security alert to SecurityAlert type
 */
function mapSecurityAlertFromDb(dbAlert: any): SecurityAlert {
  return {
    id: dbAlert.id,
    alertType: dbAlert.alert_type,
    severity: dbAlert.severity,
    source: dbAlert.source,
    description: dbAlert.description,
    details: dbAlert.details 
      ? (typeof dbAlert.details === 'string' 
        ? JSON.parse(dbAlert.details) 
        : dbAlert.details)
      : undefined,
    status: dbAlert.status,
    createdAt: new Date(dbAlert.created_at),
    updatedAt: new Date(dbAlert.updated_at),
    resolvedAt: dbAlert.resolved_at ? new Date(dbAlert.resolved_at) : undefined,
    resolvedBy: dbAlert.resolved_by,
  };
}

/**
 * Map database consent record to ConsentRecord type
 */
function mapConsentRecordFromDb(dbConsent: any): ConsentRecord {
  return {
    id: dbConsent.id,
    userId: dbConsent.user_id,
    consentType: dbConsent.consent_type,
    consentVersion: dbConsent.consent_version,
    isGranted: dbConsent.is_granted,
    ipAddress: dbConsent.ip_address,
    userAgent: dbConsent.user_agent,
    grantedAt: new Date(dbConsent.granted_at),
    revokedAt: dbConsent.revoked_at ? new Date(dbConsent.revoked_at) : undefined,
  };
}
