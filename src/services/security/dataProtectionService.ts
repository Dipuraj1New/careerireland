import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import {
  DataRetentionPolicy,
  DataRetentionEntityType,
  DataSubjectRequest,
  DataSubjectRequestType,
  DataSubjectRequestStatus,
  ConsentType
} from '@/types/security';
import {
  encryptData,
  decryptData,
  encryptTypedData,
  decryptTypedData,
  encryptObjectFields,
  decryptObjectFields,
  EncryptionDataType
} from './encryptionService';
import { maskValue, MaskingType } from './dataMaskingService';

/**
 * Create a new data retention policy
 */
export async function createDataRetentionPolicy(
  entityType: DataRetentionEntityType,
  retentionPeriod: number,
  description?: string,
  createdBy?: string
): Promise<DataRetentionPolicy> {
  const result = await db.query(
    `INSERT INTO data_retention_policies (
      id, entity_type, retention_period, description, is_active, created_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      uuidv4(),
      entityType,
      retentionPeriod,
      description || null,
      true,
      createdBy || null,
      new Date(),
      new Date()
    ]
  );

  return mapDataRetentionPolicyFromDb(result.rows[0]);
}

/**
 * Get data retention policy by entity type
 */
export async function getDataRetentionPolicyByEntityType(
  entityType: DataRetentionEntityType
): Promise<DataRetentionPolicy | null> {
  const result = await db.query(
    `SELECT * FROM data_retention_policies
     WHERE entity_type = $1 AND is_active = true`,
    [entityType]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapDataRetentionPolicyFromDb(result.rows[0]);
}

/**
 * Update data retention policy
 */
export async function updateDataRetentionPolicy(
  id: string,
  retentionPeriod?: number,
  description?: string,
  isActive?: boolean
): Promise<DataRetentionPolicy> {
  const updates = [];
  const values = [id];
  let paramIndex = 2;

  if (retentionPeriod !== undefined) {
    updates.push(`retention_period = $${paramIndex++}`);
    values.push(retentionPeriod);
  }

  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(description);
  }

  if (isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(isActive);
  }

  updates.push(`updated_at = $${paramIndex++}`);
  values.push(new Date());

  const result = await db.query(
    `UPDATE data_retention_policies
     SET ${updates.join(', ')}
     WHERE id = $1
     RETURNING *`,
    values
  );

  return mapDataRetentionPolicyFromDb(result.rows[0]);
}

/**
 * Apply data retention policies
 * This should be run as a scheduled job
 */
export async function applyDataRetentionPolicies(): Promise<number> {
  let totalDeleted = 0;

  // Get all active retention policies
  const result = await db.query(
    `SELECT * FROM data_retention_policies
     WHERE is_active = true`
  );

  const policies = result.rows.map(mapDataRetentionPolicyFromDb);

  // Apply each policy
  for (const policy of policies) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);

    let deleted = 0;

    switch (policy.entityType) {
      case DataRetentionEntityType.USER:
        // For users, we anonymize rather than delete
        const userResult = await db.query(
          `UPDATE users
           SET first_name = 'Anonymized',
               last_name = 'User',
               email = CONCAT('anonymized_', id, '@example.com'),
               password_hash = NULL,
               date_of_birth = NULL,
               nationality = NULL
           WHERE updated_at < $1
           AND NOT EXISTS (
             SELECT 1 FROM cases WHERE applicant_id = users.id
           )
           RETURNING id`,
          [cutoffDate]
        );
        deleted = userResult.rows.length;
        break;

      case DataRetentionEntityType.DOCUMENT:
        const docResult = await db.query(
          `UPDATE documents
           SET is_deleted = true,
               file_path = NULL
           WHERE updated_at < $1
           AND is_deleted = false
           RETURNING id`,
          [cutoffDate]
        );
        deleted = docResult.rows.length;
        break;

      case DataRetentionEntityType.AUDIT_LOG:
        const auditResult = await db.query(
          `DELETE FROM audit_logs
           WHERE timestamp < $1
           RETURNING id`,
          [cutoffDate]
        );
        deleted = auditResult.rows.length;
        break;

      case DataRetentionEntityType.MESSAGE:
        const msgResult = await db.query(
          `UPDATE messages
           SET content = '[Redacted due to retention policy]'
           WHERE created_at < $1
           AND content != '[Redacted due to retention policy]'
           RETURNING id`,
          [cutoffDate]
        );
        deleted = msgResult.rows.length;
        break;

      // Add other entity types as needed
    }

    totalDeleted += deleted;

    // Log the retention policy application
    await db.query(
      `INSERT INTO audit_logs (
        id, user_id, entity_type, entity_id, action, details, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        uuidv4(),
        null,
        'data_retention_policy',
        policy.id,
        'apply',
        JSON.stringify({
          entityType: policy.entityType,
          retentionPeriod: policy.retentionPeriod,
          cutoffDate: cutoffDate,
          itemsAffected: deleted
        }),
        new Date()
      ]
    );
  }

  return totalDeleted;
}

/**
 * Create a data subject request
 */
export async function createDataSubjectRequest(
  requestType: DataSubjectRequestType,
  requestData: Record<string, any>,
  userId?: string,
  createdBy?: string,
  notes?: string
): Promise<DataSubjectRequest> {
  const result = await db.query(
    `INSERT INTO data_subject_requests (
      id, user_id, request_type, status, request_data, notes, requested_at, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      uuidv4(),
      userId || null,
      requestType,
      DataSubjectRequestStatus.PENDING,
      JSON.stringify(requestData),
      notes || null,
      new Date(),
      createdBy || null
    ]
  );

  return mapDataSubjectRequestFromDb(result.rows[0]);
}

/**
 * Get data subject request by ID
 */
export async function getDataSubjectRequestById(id: string): Promise<DataSubjectRequest | null> {
  const result = await db.query(
    `SELECT * FROM data_subject_requests
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapDataSubjectRequestFromDb(result.rows[0]);
}

/**
 * Update data subject request
 */
export async function updateDataSubjectRequest(
  id: string,
  status?: DataSubjectRequestStatus,
  responseData?: Record<string, any>,
  notes?: string,
  handledBy?: string
): Promise<DataSubjectRequest> {
  const updates = [];
  const values = [id];
  let paramIndex = 2;

  if (status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (responseData !== undefined) {
    updates.push(`response_data = $${paramIndex++}`);
    values.push(JSON.stringify(responseData));
  }

  if (notes !== undefined) {
    updates.push(`notes = $${paramIndex++}`);
    values.push(notes);
  }

  if (handledBy !== undefined) {
    updates.push(`handled_by = $${paramIndex++}`);
    values.push(handledBy);
  }

  if (status === DataSubjectRequestStatus.COMPLETED) {
    updates.push(`completed_at = $${paramIndex++}`);
    values.push(new Date());
  }

  const result = await db.query(
    `UPDATE data_subject_requests
     SET ${updates.join(', ')}
     WHERE id = $1
     RETURNING *`,
    values
  );

  return mapDataSubjectRequestFromDb(result.rows[0]);
}

/**
 * Process right to be forgotten request
 */
export async function processRightToBeForgottenRequest(requestId: string, handledBy: string): Promise<boolean> {
  // Get the request
  const request = await getDataSubjectRequestById(requestId);

  if (!request || request.requestType !== DataSubjectRequestType.ERASURE || !request.userId) {
    throw new Error('Invalid request for right to be forgotten');
  }

  const userId = request.userId;

  // Start a transaction
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Anonymize user data
    await client.query(
      `UPDATE users
       SET first_name = 'Anonymized',
           last_name = 'User',
           email = CONCAT('anonymized_', id, '@example.com'),
           password_hash = NULL,
           date_of_birth = NULL,
           nationality = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // Delete or anonymize related data
    // Documents
    await client.query(
      `UPDATE documents
       SET is_deleted = true,
           file_path = NULL,
           updated_at = NOW()
       WHERE uploaded_by = $1`,
      [userId]
    );

    // Messages
    await client.query(
      `UPDATE messages
       SET content = '[Redacted due to user request]',
           updated_at = NOW()
       WHERE sender_id = $1`,
      [userId]
    );

    // Update the request status
    await client.query(
      `UPDATE data_subject_requests
       SET status = $1,
           handled_by = $2,
           completed_at = NOW(),
           response_data = $3
       WHERE id = $4`,
      [
        DataSubjectRequestStatus.COMPLETED,
        handledBy,
        JSON.stringify({ message: 'User data has been anonymized' }),
        requestId
      ]
    );

    // Log the action
    await client.query(
      `INSERT INTO audit_logs (
        id, user_id, entity_type, entity_id, action, details, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        uuidv4(),
        handledBy,
        'user',
        userId,
        'anonymize',
        JSON.stringify({
          requestId: requestId,
          requestType: DataSubjectRequestType.ERASURE
        }),
        new Date()
      ]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing right to be forgotten request:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Map database data retention policy to DataRetentionPolicy type
 */
function mapDataRetentionPolicyFromDb(dbPolicy: any): DataRetentionPolicy {
  return {
    id: dbPolicy.id,
    entityType: dbPolicy.entity_type,
    retentionPeriod: dbPolicy.retention_period,
    description: dbPolicy.description,
    isActive: dbPolicy.is_active,
    createdBy: dbPolicy.created_by,
    createdAt: new Date(dbPolicy.created_at),
    updatedAt: new Date(dbPolicy.updated_at),
  };
}

/**
 * Map database data subject request to DataSubjectRequest type
 */
function mapDataSubjectRequestFromDb(dbRequest: any): DataSubjectRequest {
  return {
    id: dbRequest.id,
    userId: dbRequest.user_id,
    requestType: dbRequest.request_type,
    status: dbRequest.status,
    requestData: typeof dbRequest.request_data === 'string'
      ? JSON.parse(dbRequest.request_data)
      : dbRequest.request_data,
    responseData: dbRequest.response_data
      ? (typeof dbRequest.response_data === 'string'
        ? JSON.parse(dbRequest.response_data)
        : dbRequest.response_data)
      : undefined,
    notes: dbRequest.notes,
    requestedAt: new Date(dbRequest.requested_at),
    completedAt: dbRequest.completed_at ? new Date(dbRequest.completed_at) : undefined,
    createdBy: dbRequest.created_by,
    handledBy: dbRequest.handled_by,
  };
}

/**
 * Get sensitive field definitions for a specific entity type
 * @param entityType The type of entity
 * @returns Map of field names to their data types and masking types
 */
export async function getSensitiveFieldDefinitions(
  entityType: string
): Promise<Record<string, { encryptionType: EncryptionDataType, maskingType: MaskingType }>> {
  // Get sensitive field definitions from database or configuration
  const result = await db.query(
    `SELECT * FROM sensitive_field_definitions
     WHERE entity_type = $1`,
    [entityType]
  );

  const fieldDefinitions: Record<string, { encryptionType: EncryptionDataType, maskingType: MaskingType }> = {};

  for (const row of result.rows) {
    fieldDefinitions[row.field_name] = {
      encryptionType: row.encryption_type as EncryptionDataType,
      maskingType: row.masking_type as MaskingType
    };
  }

  return fieldDefinitions;
}

/**
 * Encrypt sensitive fields in an entity
 * @param entityType The type of entity
 * @param entity The entity object
 * @returns Object with encrypted fields and encryption metadata
 */
export async function encryptSensitiveFields(
  entityType: string,
  entity: Record<string, any>
): Promise<{
  encryptedEntity: Record<string, any>,
  encryptionMetadata: Record<string, { keyIdentifier: string, dataType: EncryptionDataType }>
}> {
  // Get sensitive field definitions
  const fieldDefinitions = await getSensitiveFieldDefinitions(entityType);

  // Create a map of fields to encrypt with their data types
  const fieldsToEncrypt: Record<string, EncryptionDataType> = {};

  for (const [field, definition] of Object.entries(fieldDefinitions)) {
    fieldsToEncrypt[field] = definition.encryptionType;
  }

  // Encrypt the fields
  return encryptObjectFields(entity, fieldsToEncrypt, entityType);
}

/**
 * Decrypt sensitive fields in an entity
 * @param entityType The type of entity
 * @param encryptedEntity The entity with encrypted fields
 * @param encryptionMetadata Metadata about the encrypted fields
 * @returns Entity with decrypted fields
 */
export async function decryptSensitiveFields(
  entityType: string,
  encryptedEntity: Record<string, any>,
  encryptionMetadata: Record<string, { keyIdentifier: string, dataType: EncryptionDataType }>
): Promise<Record<string, any>> {
  return decryptObjectFields(encryptedEntity, encryptionMetadata, entityType);
}

/**
 * Mask sensitive fields in an entity for display
 * @param entityType The type of entity
 * @param entity The entity object (with decrypted values)
 * @returns Entity with masked sensitive fields
 */
export function maskSensitiveFields(
  entityType: string,
  entity: Record<string, any>,
  fieldsToMask?: string[]
): Record<string, any> {
  // Create a copy of the entity
  const maskedEntity = { ...entity };

  // Get sensitive field definitions
  return getSensitiveFieldDefinitions(entityType)
    .then(fieldDefinitions => {
      // Filter fields if fieldsToMask is provided
      const fields = fieldsToMask
        ? Object.keys(fieldDefinitions).filter(field => fieldsToMask.includes(field))
        : Object.keys(fieldDefinitions);

      // Apply masking to each field
      for (const field of fields) {
        if (entity[field] !== undefined && entity[field] !== null) {
          const definition = fieldDefinitions[field];
          maskedEntity[field] = maskValue(String(entity[field]), definition.maskingType);
        }
      }

      return maskedEntity;
    })
    .catch(error => {
      console.error('Error masking sensitive fields:', error);
      return entity; // Return original entity on error
    });
}

/**
 * Record user consent
 * @param userId User ID
 * @param consentType Type of consent
 * @param consentVersion Version of the consent document
 * @param isGranted Whether consent is granted
 * @param ipAddress IP address of the user
 * @param userAgent User agent of the user
 * @returns Created consent record
 */
export async function recordUserConsent(
  userId: string,
  consentType: ConsentType,
  consentVersion: string,
  isGranted: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<{ id: string, grantedAt: Date }> {
  // Check if consent record already exists
  const existingResult = await db.query(
    `SELECT * FROM consent_records
     WHERE user_id = $1 AND consent_type = $2 AND consent_version = $3
     AND revoked_at IS NULL`,
    [userId, consentType, consentVersion]
  );

  // If consent record exists and the grant status is the same, return it
  if (existingResult.rows.length > 0 && existingResult.rows[0].is_granted === isGranted) {
    return {
      id: existingResult.rows[0].id,
      grantedAt: new Date(existingResult.rows[0].granted_at)
    };
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
    RETURNING id, granted_at`,
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

  return {
    id: result.rows[0].id,
    grantedAt: new Date(result.rows[0].granted_at)
  };
}

/**
 * Check if user has granted consent
 * @param userId User ID
 * @param consentType Type of consent
 * @param consentVersion Optional specific version to check
 * @returns Whether consent is granted
 */
export async function hasUserConsent(
  userId: string,
  consentType: ConsentType,
  consentVersion?: string
): Promise<boolean> {
  let query = `
    SELECT * FROM consent_records
    WHERE user_id = $1 AND consent_type = $2 AND is_granted = true
    AND revoked_at IS NULL
  `;

  const params = [userId, consentType];

  if (consentVersion) {
    query += ` AND consent_version = $3`;
    params.push(consentVersion);
  } else {
    // If no specific version is requested, get the latest one
    query += ` ORDER BY granted_at DESC LIMIT 1`;
  }

  const result = await db.query(query, params);

  return result.rows.length > 0;
}
