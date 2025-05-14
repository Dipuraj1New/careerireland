import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { FieldEncryptionKey } from '@/types/security';

// Constants
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || '';

// Supported data types for encryption
export enum EncryptionDataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  OBJECT = 'object',
  ARRAY = 'array'
}

if (!MASTER_KEY && process.env.NODE_ENV === 'production') {
  console.error('ENCRYPTION_MASTER_KEY is not set in production environment!');
}

/**
 * Generate a new encryption key
 */
export async function generateEncryptionKey(): Promise<FieldEncryptionKey> {
  // Generate a random key
  const key = crypto.randomBytes(KEY_LENGTH);

  // Encrypt the key with the master key
  const encryptedKey = encryptWithMasterKey(key);

  // Generate a unique identifier for the key
  const keyIdentifier = uuidv4();

  // Calculate rotation date (90 days from now)
  const rotationDate = new Date();
  rotationDate.setDate(rotationDate.getDate() + 90);

  // Store the encrypted key in the database
  const result = await db.query(
    `INSERT INTO field_encryption_keys (
      id, key_identifier, encrypted_key, is_active, created_at, rotation_date
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      uuidv4(),
      keyIdentifier,
      encryptedKey,
      true,
      new Date(),
      rotationDate
    ]
  );

  return mapFieldEncryptionKeyFromDb(result.rows[0]);
}

/**
 * Get the active encryption key
 */
export async function getActiveEncryptionKey(): Promise<FieldEncryptionKey> {
  const result = await db.query(
    `SELECT * FROM field_encryption_keys
     WHERE is_active = true
     ORDER BY created_at DESC
     LIMIT 1`
  );

  if (result.rows.length === 0) {
    // No active key found, generate a new one
    return generateEncryptionKey();
  }

  // Update last_used_at
  await db.query(
    `UPDATE field_encryption_keys
     SET last_used_at = NOW()
     WHERE id = $1`,
    [result.rows[0].id]
  );

  return mapFieldEncryptionKeyFromDb(result.rows[0]);
}

/**
 * Get encryption key by identifier
 */
export async function getEncryptionKeyByIdentifier(keyIdentifier: string): Promise<FieldEncryptionKey | null> {
  const result = await db.query(
    `SELECT * FROM field_encryption_keys
     WHERE key_identifier = $1`,
    [keyIdentifier]
  );

  if (result.rows.length === 0) {
    return null;
  }

  // Update last_used_at
  await db.query(
    `UPDATE field_encryption_keys
     SET last_used_at = NOW()
     WHERE id = $1`,
    [result.rows[0].id]
  );

  return mapFieldEncryptionKeyFromDb(result.rows[0]);
}

/**
 * Encrypt data with field-level encryption
 * @param data The data to encrypt (string)
 * @param context Optional context for authenticated encryption
 * @returns Object containing encrypted data and key identifier
 */
export async function encryptData(data: string, context?: string): Promise<{ encryptedData: string, keyIdentifier: string }> {
  return encryptTypedData(data, EncryptionDataType.STRING, context);
}

/**
 * Encrypt typed data with field-level encryption
 * @param data The data to encrypt (any type)
 * @param dataType The type of data being encrypted
 * @param context Optional context for authenticated encryption
 * @returns Object containing encrypted data and key identifier
 */
export async function encryptTypedData(
  data: any,
  dataType: EncryptionDataType,
  context?: string
): Promise<{ encryptedData: string, keyIdentifier: string, dataType: EncryptionDataType }> {
  // Get the active encryption key
  const encryptionKey = await getActiveEncryptionKey();

  // Decrypt the encryption key with the master key
  const key = decryptWithMasterKey(encryptionKey.encryptedKey);

  // Convert data to string based on type
  let stringData: string;

  switch (dataType) {
    case EncryptionDataType.STRING:
      stringData = String(data);
      break;
    case EncryptionDataType.NUMBER:
      stringData = String(data);
      break;
    case EncryptionDataType.BOOLEAN:
      stringData = data ? 'true' : 'false';
      break;
    case EncryptionDataType.DATE:
      if (data instanceof Date) {
        stringData = data.toISOString();
      } else {
        const date = new Date(data);
        stringData = date.toISOString();
      }
      break;
    case EncryptionDataType.OBJECT:
    case EncryptionDataType.ARRAY:
      stringData = JSON.stringify(data);
      break;
    default:
      stringData = String(data);
  }

  // Generate a random initialization vector
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Set authentication data (AAD) if context is provided
  if (context) {
    cipher.setAAD(Buffer.from(context));
  }

  // Encrypt the data
  let encrypted = cipher.update(stringData, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Get the authentication tag
  const authTag = cipher.getAuthTag();

  // Combine IV, encrypted data, and auth tag
  const encryptedData = Buffer.concat([
    iv,
    Buffer.from(encrypted, 'base64'),
    authTag
  ]).toString('base64');

  return {
    encryptedData,
    keyIdentifier: encryptionKey.keyIdentifier,
    dataType
  };
}

/**
 * Decrypt data with field-level encryption
 * @param encryptedData The encrypted data
 * @param keyIdentifier The key identifier used for encryption
 * @param context Optional context for authenticated encryption
 * @returns Decrypted string
 */
export async function decryptData(encryptedData: string, keyIdentifier: string, context?: string): Promise<string> {
  const result = await decryptTypedData(encryptedData, keyIdentifier, EncryptionDataType.STRING, context);
  return result.data as string;
}

/**
 * Decrypt typed data with field-level encryption
 * @param encryptedData The encrypted data
 * @param keyIdentifier The key identifier used for encryption
 * @param dataType The type of the encrypted data
 * @param context Optional context for authenticated encryption
 * @returns Object containing decrypted data and its type
 */
export async function decryptTypedData(
  encryptedData: string,
  keyIdentifier: string,
  dataType: EncryptionDataType,
  context?: string
): Promise<{ data: any, dataType: EncryptionDataType }> {
  // Get the encryption key
  const encryptionKey = await getEncryptionKeyByIdentifier(keyIdentifier);

  if (!encryptionKey) {
    throw new Error(`Encryption key not found: ${keyIdentifier}`);
  }

  // Decrypt the encryption key with the master key
  const key = decryptWithMasterKey(encryptionKey.encryptedKey);

  // Decode the encrypted data
  const buffer = Buffer.from(encryptedData, 'base64');

  // Extract IV, encrypted data, and auth tag
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(buffer.length - AUTH_TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH, buffer.length - AUTH_TAG_LENGTH);

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Set authentication data (AAD) if context is provided
  if (context) {
    decipher.setAAD(Buffer.from(context));
  }

  // Decrypt the data
  let decrypted = decipher.update(encrypted.toString('base64'), 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  // Convert the decrypted string back to its original type
  let typedData: any;

  switch (dataType) {
    case EncryptionDataType.STRING:
      typedData = decrypted;
      break;
    case EncryptionDataType.NUMBER:
      typedData = Number(decrypted);
      break;
    case EncryptionDataType.BOOLEAN:
      typedData = decrypted === 'true';
      break;
    case EncryptionDataType.DATE:
      typedData = new Date(decrypted);
      break;
    case EncryptionDataType.OBJECT:
    case EncryptionDataType.ARRAY:
      try {
        typedData = JSON.parse(decrypted);
      } catch (error) {
        throw new Error('Failed to parse decrypted data as JSON');
      }
      break;
    default:
      typedData = decrypted;
  }

  return {
    data: typedData,
    dataType
  };
}

/**
 * Encrypt with master key
 */
function encryptWithMasterKey(data: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(MASTER_KEY, 'salt', KEY_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, encrypted, authTag]).toString('base64');
}

/**
 * Decrypt with master key
 */
function decryptWithMasterKey(encryptedData: string): Buffer {
  const buffer = Buffer.from(encryptedData, 'base64');

  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(buffer.length - AUTH_TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH, buffer.length - AUTH_TAG_LENGTH);

  const key = crypto.scryptSync(MASTER_KEY, 'salt', KEY_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted;
}

/**
 * Map database field encryption key to FieldEncryptionKey type
 */
function mapFieldEncryptionKeyFromDb(dbKey: any): FieldEncryptionKey {
  return {
    id: dbKey.id,
    keyIdentifier: dbKey.key_identifier,
    encryptedKey: dbKey.encrypted_key,
    isActive: dbKey.is_active,
    createdAt: new Date(dbKey.created_at),
    rotationDate: dbKey.rotation_date ? new Date(dbKey.rotation_date) : undefined,
    lastUsedAt: dbKey.last_used_at ? new Date(dbKey.last_used_at) : undefined,
  };
}

/**
 * Encrypt specific fields in an object
 * @param obj The object containing fields to encrypt
 * @param fieldsToEncrypt Map of field names to their data types
 * @param context Optional context for authenticated encryption
 * @returns Object with encrypted fields and encryption metadata
 */
export async function encryptObjectFields(
  obj: Record<string, any>,
  fieldsToEncrypt: Record<string, EncryptionDataType>,
  context?: string
): Promise<{
  encryptedObject: Record<string, any>,
  encryptionMetadata: Record<string, { keyIdentifier: string, dataType: EncryptionDataType }>
}> {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Invalid object provided for encryption');
  }

  const encryptedObject: Record<string, any> = { ...obj };
  const encryptionMetadata: Record<string, { keyIdentifier: string, dataType: EncryptionDataType }> = {};

  for (const [field, dataType] of Object.entries(fieldsToEncrypt)) {
    // Skip if field doesn't exist in the object
    if (obj[field] === undefined || obj[field] === null) {
      continue;
    }

    // Encrypt the field
    const { encryptedData, keyIdentifier } = await encryptTypedData(
      obj[field],
      dataType,
      context ? `${context}:${field}` : field
    );

    // Store the encrypted data and metadata
    encryptedObject[field] = encryptedData;
    encryptionMetadata[field] = { keyIdentifier, dataType };
  }

  return {
    encryptedObject,
    encryptionMetadata
  };
}

/**
 * Decrypt specific fields in an object
 * @param encryptedObject The object containing encrypted fields
 * @param encryptionMetadata Metadata about the encrypted fields
 * @param context Optional context for authenticated encryption
 * @returns Object with decrypted fields
 */
export async function decryptObjectFields(
  encryptedObject: Record<string, any>,
  encryptionMetadata: Record<string, { keyIdentifier: string, dataType: EncryptionDataType }>,
  context?: string
): Promise<Record<string, any>> {
  if (!encryptedObject || typeof encryptedObject !== 'object') {
    throw new Error('Invalid object provided for decryption');
  }

  if (!encryptionMetadata || typeof encryptionMetadata !== 'object') {
    throw new Error('Invalid encryption metadata provided');
  }

  const decryptedObject: Record<string, any> = { ...encryptedObject };

  for (const [field, metadata] of Object.entries(encryptionMetadata)) {
    // Skip if field doesn't exist in the object
    if (encryptedObject[field] === undefined || encryptedObject[field] === null) {
      continue;
    }

    // Decrypt the field
    const { data } = await decryptTypedData(
      encryptedObject[field],
      metadata.keyIdentifier,
      metadata.dataType,
      context ? `${context}:${field}` : field
    );

    // Store the decrypted data
    decryptedObject[field] = data;
  }

  return decryptedObject;
}

/**
 * Rotate encryption key for encrypted data
 * @param encryptedData The encrypted data
 * @param keyIdentifier The current key identifier
 * @param dataType The type of the encrypted data
 * @param context Optional context for authenticated encryption
 * @returns Object with newly encrypted data and new key identifier
 */
export async function rotateEncryptionKey(
  encryptedData: string,
  keyIdentifier: string,
  dataType: EncryptionDataType,
  context?: string
): Promise<{ encryptedData: string, keyIdentifier: string }> {
  // Decrypt the data with the old key
  const { data } = await decryptTypedData(encryptedData, keyIdentifier, dataType, context);

  // Encrypt the data with a new key
  const result = await encryptTypedData(data, dataType, context);

  return {
    encryptedData: result.encryptedData,
    keyIdentifier: result.keyIdentifier
  };
}
