import { NextRequest, NextResponse } from 'next/server';
import { getDocumentsByCase } from '@/services/document/documentService';
import { getUserFromRequest } from '@/lib/auth';
import { UserRole } from '@/types/user';

/**
 * GET /api/documents?caseId=<caseId>
 * Get documents by case ID
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get case ID from query params
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    
    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }
    
    // Get documents by case ID
    const documents = await getDocumentsByCase(caseId);
    
    return NextResponse.json(
      { documents },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error getting documents:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get documents' },
      { status: 500 }
    );
  }
}
