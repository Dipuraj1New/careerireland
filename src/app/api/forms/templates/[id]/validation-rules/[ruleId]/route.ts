/**
 * API route for managing a specific validation rule
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import * as validationRuleService from '@/services/form/validationRuleService';
import { UserRole } from '@/types/user';

/**
 * GET /api/forms/templates/:id/validation-rules/:ruleId
 * Get a specific validation rule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; ruleId: string } }
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
    
    // Get validation rule
    const validationRule = await validationRuleService.getValidationRuleById(params.ruleId);
    
    if (!validationRule) {
      return NextResponse.json(
        { error: 'Validation rule not found' },
        { status: 404 }
      );
    }
    
    // Check if rule belongs to the specified template
    if (validationRule.templateId !== params.id) {
      return NextResponse.json(
        { error: 'Validation rule does not belong to the specified template' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      validationRule,
    });
  } catch (error: any) {
    console.error('Error getting validation rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get validation rule' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/forms/templates/:id/validation-rules/:ruleId
 * Update a validation rule
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; ruleId: string } }
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
    
    // Only admins can update validation rules
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Get existing validation rule
    const existingRule = await validationRuleService.getValidationRuleById(params.ruleId);
    
    if (!existingRule) {
      return NextResponse.json(
        { error: 'Validation rule not found' },
        { status: 404 }
      );
    }
    
    // Check if rule belongs to the specified template
    if (existingRule.templateId !== params.id) {
      return NextResponse.json(
        { error: 'Validation rule does not belong to the specified template' },
        { status: 400 }
      );
    }
    
    // Update validation rule
    const validationRule = await validationRuleService.updateValidationRule(
      params.ruleId,
      {
        fieldName: body.fieldName,
        ruleType: body.ruleType,
        ruleValue: body.ruleValue,
        errorMessage: body.errorMessage,
      }
    );
    
    return NextResponse.json({
      success: true,
      validationRule,
    });
  } catch (error: any) {
    console.error('Error updating validation rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update validation rule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/forms/templates/:id/validation-rules/:ruleId
 * Delete a validation rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; ruleId: string } }
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
    
    // Only admins can delete validation rules
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get existing validation rule
    const existingRule = await validationRuleService.getValidationRuleById(params.ruleId);
    
    if (!existingRule) {
      return NextResponse.json(
        { error: 'Validation rule not found' },
        { status: 404 }
      );
    }
    
    // Check if rule belongs to the specified template
    if (existingRule.templateId !== params.id) {
      return NextResponse.json(
        { error: 'Validation rule does not belong to the specified template' },
        { status: 400 }
      );
    }
    
    // Delete validation rule
    const success = await validationRuleService.deleteValidationRule(params.ruleId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete validation rule' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting validation rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete validation rule' },
      { status: 500 }
    );
  }
}
