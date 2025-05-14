import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { 
  createSecurityPolicy,
  getSecurityPolicyById,
  getActiveSecurityPolicyByType,
  updateSecurityPolicy
} from '@/services/security/securityPolicyService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditEntityType, AuditAction } from '@/types/audit';
import { UserRole } from '@/types/user';
import { SecurityPolicyType } from '@/types/security';

/**
 * GET /api/security/policies
 * Get security policies
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
    
    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const type = url.searchParams.get('type') as SecurityPolicyType | null;
    const activeOnly = url.searchParams.get('activeOnly') === 'true';
    
    // Build query
    let query = `
      SELECT * FROM security_policies
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (type) {
      query += ` AND policy_type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (activeOnly) {
      query += ` AND is_active = true`;
    }
    
    // Add ordering
    query += ` ORDER BY policy_type, version DESC`;
    
    // Execute query
    const result = await db.query(query, params);
    
    // Map results
    const policies = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      policyType: row.policy_type,
      policyData: typeof row.policy_data === 'string' 
        ? JSON.parse(row.policy_data) 
        : row.policy_data,
      isActive: row.is_active,
      version: row.version,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
    
    return NextResponse.json(policies);
  } catch (error) {
    console.error('Error getting security policies:', error);
    return NextResponse.json(
      { error: 'Failed to get security policies' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/policies
 * Create a new security policy
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
    
    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate request
    if (!body.name || !body.policyType || !body.policyData) {
      return NextResponse.json(
        { error: 'Name, policy type, and policy data are required' },
        { status: 400 }
      );
    }
    
    // Create the policy
    const policy = await createSecurityPolicy(
      body.name,
      body.policyType,
      body.policyData,
      body.description,
      session.user.id
    );
    
    // Log the action
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: session.user.id,
      action: AuditAction.CREATE,
      details: {
        action: 'create_security_policy',
        policyId: policy.id,
        policyType: policy.policyType
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
      userAgent: req.headers.get('user-agent')
    });
    
    return NextResponse.json(policy);
  } catch (error) {
    console.error('Error creating security policy:', error);
    return NextResponse.json(
      { error: 'Failed to create security policy' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/security/policies/[id]
 * Get a specific security policy
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const policyId = params.id;
    
    // If this is a policy type rather than an ID, get the active policy of that type
    if (Object.values(SecurityPolicyType).includes(policyId as SecurityPolicyType)) {
      const policy = await getActiveSecurityPolicyByType(policyId as SecurityPolicyType);
      
      if (!policy) {
        return NextResponse.json(
          { error: 'Policy not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(policy);
    }
    
    // Otherwise, get the policy by ID
    const policy = await getSecurityPolicyById(policyId);
    
    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }
    
    // Check if user is admin or if this is a public policy
    const isPublicPolicy = [
      SecurityPolicyType.PASSWORD,
      SecurityPolicyType.SESSION
    ].includes(policy.policyType);
    
    if (!isPublicPolicy && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(policy);
  } catch (error) {
    console.error('Error getting security policy:', error);
    return NextResponse.json(
      { error: 'Failed to get security policy' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/security/policies/[id]
 * Update a security policy
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const policyId = params.id;
    
    // Get the policy
    const policy = await getSecurityPolicyById(policyId);
    
    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Update the policy
    const updatedPolicy = await updateSecurityPolicy(
      policyId,
      body.name,
      body.policyData,
      body.description,
      body.isActive
    );
    
    // Log the action
    await createAuditLog({
      userId: session.user.id,
      entityType: AuditEntityType.USER,
      entityId: session.user.id,
      action: AuditAction.UPDATE,
      details: {
        action: 'update_security_policy',
        policyId,
        policyType: policy.policyType,
        oldVersion: policy.version,
        newVersion: updatedPolicy.version
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.ip,
      userAgent: req.headers.get('user-agent')
    });
    
    return NextResponse.json(updatedPolicy);
  } catch (error) {
    console.error('Error updating security policy:', error);
    return NextResponse.json(
      { error: 'Failed to update security policy' },
      { status: 500 }
    );
  }
}
