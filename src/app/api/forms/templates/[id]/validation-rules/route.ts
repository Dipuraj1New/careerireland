/**
 * API route for managing validation rules for a form template
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import * as validationRuleService from '@/services/form/validationRuleService';
import { UserRole } from '@/types/user';

/**
 * GET /api/forms/templates/:id/validation-rules
 * Get validation rules for a form template
 */
export async function GET(
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
    
    // Get validation rules
    const validationRules = await validationRuleService.getValidationRulesByTemplateId(params.id);
    
    return NextResponse.json({
      success: true,
      validationRules,
    });
  } catch (error: any) {
    console.error('Error getting validation rules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get validation rules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forms/templates/:id/validation-rules
 * Create a new validation rule for a form template
 */
export async function POST(
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
    
    // Only admins can create validation rules
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    if (!body.fieldName || !body.ruleType || !body.errorMessage) {
      return NextResponse.json(
        { error: 'Field name, rule type, and error message are required' },
        { status: 400 }
      );
    }
    
    // Create validation rule
    const validationRule = await validationRuleService.createValidationRule({
      templateId: params.id,
      fieldName: body.fieldName,
      ruleType: body.ruleType,
      ruleValue: body.ruleValue || '',
      errorMessage: body.errorMessage,
    });
    
    return NextResponse.json({
      success: true,
      validationRule,
    });
  } catch (error: any) {
    console.error('Error creating validation rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create validation rule' },
      { status: 500 }
    );
  }
}
