/**
 * API route for managing individual portal field mappings
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import * as portalIntegrationService from '../../../../../../services/portal/portalIntegrationService';
import { UserRole } from '../../../../../../types/user';

/**
 * PATCH /api/portal/field-mappings/:id
 * Update a field mapping
 */
export async function PATCH(
  request: NextRequest,
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
    
    // Only admins can update field mappings
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    if (!body.portalField) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Update field mapping
    const result = await portalIntegrationService.updateFieldMapping(
      params.id,
      {
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
    console.error('Error updating field mapping:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update field mapping' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portal/field-mappings/:id
 * Delete a field mapping
 */
export async function DELETE(
  request: NextRequest,
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
    
    // Only admins can delete field mappings
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Delete field mapping
    const result = await portalIntegrationService.deleteFieldMapping(
      params.id,
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
    });
  } catch (error: any) {
    console.error('Error deleting field mapping:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete field mapping' },
      { status: 500 }
    );
  }
}
