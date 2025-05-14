import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  encryptSensitiveFields,
  decryptSensitiveFields,
  maskSensitiveFields,
  getSensitiveFieldDefinitions
} from '@/services/security/dataProtectionService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';

/**
 * GET /api/security/data-protection/field-definitions
 * Get sensitive field definitions for a specific entity type
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const entityType = url.searchParams.get('entityType');
    
    if (!entityType) {
      return NextResponse.json(
        { error: 'Entity type is required' },
        { status: 400 }
      );
    }
    
    // Get sensitive field definitions
    const fieldDefinitions = await getSensitiveFieldDefinitions(entityType);
    
    // For security, only return masking types, not encryption types
    const sanitizedDefinitions: Record<string, { maskingType: string }> = {};
    
    for (const [field, definition] of Object.entries(fieldDefinitions)) {
      sanitizedDefinitions[field] = {
        maskingType: definition.maskingType
      };
    }
    
    return NextResponse.json(sanitizedDefinitions);
  } catch (error) {
    console.error('Error getting sensitive field definitions:', error);
    return NextResponse.json(
      { error: 'Failed to get sensitive field definitions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/data-protection/encrypt
 * Encrypt sensitive fields in an entity
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate request
    if (!body.entityType || !body.entity || typeof body.entity !== 'object') {
      return NextResponse.json(
        { error: 'Entity type and entity object are required' },
        { status: 400 }
      );
    }
    
    // Encrypt sensitive fields
    const { encryptedEntity, encryptionMetadata } = await encryptSensitiveFields(
      body.entityType,
      body.entity
    );
    
    // Log the action
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: session.user.id,
      action: AuditAction.CREATE,
      details: {
        action: 'encrypt_sensitive_fields',
        entityType: body.entityType,
        fields: Object.keys(encryptionMetadata)
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
      userAgent: req.headers.get('user-agent')
    });
    
    return NextResponse.json({
      encryptedEntity,
      encryptionMetadata
    });
  } catch (error) {
    console.error('Error encrypting sensitive fields:', error);
    return NextResponse.json(
      { error: 'Failed to encrypt sensitive fields' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/security/data-protection/decrypt
 * Decrypt sensitive fields in an entity
 */
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate request
    if (!body.entityType || !body.encryptedEntity || !body.encryptionMetadata) {
      return NextResponse.json(
        { error: 'Entity type, encrypted entity, and encryption metadata are required' },
        { status: 400 }
      );
    }
    
    // Decrypt sensitive fields
    const decryptedEntity = await decryptSensitiveFields(
      body.entityType,
      body.encryptedEntity,
      body.encryptionMetadata
    );
    
    // Log the action
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: session.user.id,
      action: AuditAction.READ,
      details: {
        action: 'decrypt_sensitive_fields',
        entityType: body.entityType,
        fields: Object.keys(body.encryptionMetadata)
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
      userAgent: req.headers.get('user-agent')
    });
    
    return NextResponse.json({
      entity: decryptedEntity
    });
  } catch (error) {
    console.error('Error decrypting sensitive fields:', error);
    return NextResponse.json(
      { error: 'Failed to decrypt sensitive fields' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/security/data-protection/mask
 * Mask sensitive fields in an entity for display
 */
export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate request
    if (!body.entityType || !body.entity) {
      return NextResponse.json(
        { error: 'Entity type and entity are required' },
        { status: 400 }
      );
    }
    
    // Mask sensitive fields
    const maskedEntity = await maskSensitiveFields(
      body.entityType,
      body.entity,
      body.fieldsToMask
    );
    
    return NextResponse.json({
      maskedEntity
    });
  } catch (error) {
    console.error('Error masking sensitive fields:', error);
    return NextResponse.json(
      { error: 'Failed to mask sensitive fields' },
      { status: 500 }
    );
  }
}
