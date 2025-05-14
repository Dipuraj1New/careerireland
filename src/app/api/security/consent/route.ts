import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { 
  recordUserConsent,
  hasUserConsent
} from '@/services/security/dataProtectionService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { ConsentType } from '@/types/security';

/**
 * GET /api/security/consent
 * Check user consent status
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
    const consentType = url.searchParams.get('type') as ConsentType | null;
    const consentVersion = url.searchParams.get('version');
    
    if (!consentType) {
      return NextResponse.json(
        { error: 'Consent type is required' },
        { status: 400 }
      );
    }
    
    // Check if the consent type is valid
    if (!Object.values(ConsentType).includes(consentType)) {
      return NextResponse.json(
        { error: 'Invalid consent type' },
        { status: 400 }
      );
    }
    
    // Check if user has granted consent
    const hasConsent = await hasUserConsent(
      session.user.id,
      consentType,
      consentVersion || undefined
    );
    
    return NextResponse.json({
      hasConsent
    });
  } catch (error) {
    console.error('Error checking consent status:', error);
    return NextResponse.json(
      { error: 'Failed to check consent status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/consent
 * Record user consent
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
    if (!body.consentType || !body.consentVersion) {
      return NextResponse.json(
        { error: 'Consent type and version are required' },
        { status: 400 }
      );
    }
    
    // Check if the consent type is valid
    if (!Object.values(ConsentType).includes(body.consentType)) {
      return NextResponse.json(
        { error: 'Invalid consent type' },
        { status: 400 }
      );
    }
    
    // Default isGranted to true if not provided
    const isGranted = body.isGranted !== false;
    
    // Record user consent
    const result = await recordUserConsent(
      session.user.id,
      body.consentType,
      body.consentVersion,
      isGranted,
      req.headers.get('x-forwarded-for') || req.ip,
      req.headers.get('user-agent')
    );
    
    // Log the action
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: session.user.id,
      action: AuditAction.UPDATE,
      details: {
        action: isGranted ? 'grant_consent' : 'revoke_consent',
        consentType: body.consentType,
        consentVersion: body.consentVersion
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
      userAgent: req.headers.get('user-agent')
    });
    
    return NextResponse.json({
      id: result.id,
      grantedAt: result.grantedAt,
      isGranted
    });
  } catch (error) {
    console.error('Error recording consent:', error);
    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/security/consent/history
 * Get user consent history
 */
export async function GET(req: NextRequest, context: { params: { history: string } }) {
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
    const consentType = url.searchParams.get('type') as ConsentType | null;
    
    // Build query
    let query = `
      SELECT id, consent_type, consent_version, is_granted, 
             granted_at, revoked_at, ip_address, user_agent
      FROM consent_records
      WHERE user_id = $1
    `;
    
    const params = [session.user.id];
    
    if (consentType) {
      query += ` AND consent_type = $2`;
      params.push(consentType);
    }
    
    query += ` ORDER BY granted_at DESC`;
    
    // Get consent history
    const result = await db.query(query, params);
    
    // Map results
    const history = result.rows.map(row => ({
      id: row.id,
      consentType: row.consent_type,
      consentVersion: row.consent_version,
      isGranted: row.is_granted,
      grantedAt: new Date(row.granted_at),
      revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
      ipAddress: row.ip_address,
      userAgent: row.user_agent
    }));
    
    return NextResponse.json({
      history
    });
  } catch (error) {
    console.error('Error getting consent history:', error);
    return NextResponse.json(
      { error: 'Failed to get consent history' },
      { status: 500 }
    );
  }
}
