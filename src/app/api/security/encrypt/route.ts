import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { encryptData, decryptData } from '@/services/security/encryptionService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';
import { withAuth } from '@/middleware/authMiddleware';

/**
 * POST /api/security/encrypt
 * Encrypt data with field-level encryption
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
    if (!body.data) {
      return NextResponse.json(
        { error: 'Data is required' },
        { status: 400 }
      );
    }
    
    // Encrypt the data
    const { encryptedData, keyIdentifier } = await encryptData(
      body.data,
      body.context
    );
    
    // Log the action
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: session.user.id,
      action: AuditAction.CREATE,
      details: {
        action: 'encrypt_data',
        keyIdentifier
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
      userAgent: req.headers.get('user-agent')
    });
    
    return NextResponse.json({
      encryptedData,
      keyIdentifier
    });
  } catch (error) {
    console.error('Error encrypting data:', error);
    return NextResponse.json(
      { error: 'Failed to encrypt data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/decrypt
 * Decrypt data with field-level encryption
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
    if (!body.encryptedData || !body.keyIdentifier) {
      return NextResponse.json(
        { error: 'Encrypted data and key identifier are required' },
        { status: 400 }
      );
    }
    
    // Decrypt the data
    const data = await decryptData(
      body.encryptedData,
      body.keyIdentifier,
      body.context
    );
    
    // Log the action
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: session.user.id,
      action: AuditAction.CREATE,
      details: {
        action: 'decrypt_data',
        keyIdentifier: body.keyIdentifier
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
      userAgent: req.headers.get('user-agent')
    });
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error decrypting data:', error);
    return NextResponse.json(
      { error: 'Failed to decrypt data' },
      { status: 500 }
    );
  }
}
