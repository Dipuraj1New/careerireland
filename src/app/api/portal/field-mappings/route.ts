/**
 * API route for managing portal field mappings
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import * as portalIntegrationService from '../../../../../services/portal/portalIntegrationService';
import { UserRole } from '../../../../../types/user';
import { GovernmentPortalType } from '../../../../../types/portal';

/**
 * GET /api/portal/field-mappings
 * Get field mappings for a portal type
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only agents and admins can access field mappings
    if (session.user.role !== UserRole.AGENT && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get portal type from query parameter
    const searchParams = request.nextUrl.searchParams;
    const portalType = searchParams.get('portalType');
    
    if (!portalType || !Object.values(GovernmentPortalType).includes(portalType as GovernmentPortalType)) {
      return NextResponse.json(
        { error: 'Invalid portal type' },
        { status: 400 }
      );
    }
    
    // Get field mappings
    const fieldMappings = await portalIntegrationService.getFieldMappings(
      portalType as GovernmentPortalType
    );
    
    return NextResponse.json({
      success: true,
      fieldMappings,
    });
  } catch (error: any) {
    console.error('Error getting field mappings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get field mappings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/field-mappings
 * Create a new field mapping
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only admins can create field mappings
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    if (!body.portalType || !body.formField || !body.portalField) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (!Object.values(GovernmentPortalType).includes(body.portalType)) {
      return NextResponse.json(
        { error: 'Invalid portal type' },
        { status: 400 }
      );
    }
    
    // Create field mapping
    const result = await portalIntegrationService.createFieldMapping(
      {
        portalType: body.portalType,
        formField: body.formField,
        portalField: body.portalField,
      },
      session.user.id
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      mapping: result.mapping,
    });
  } catch (error: any) {
    console.error('Error creating field mapping:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create field mapping' },
      { status: 500 }
    );
  }
}
