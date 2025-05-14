import { NextRequest, NextResponse } from 'next/server';
import { uploadDocument } from '@/services/document/documentService';
import { getUserFromRequest } from '@/lib/auth';
import { DocumentType } from '@/types/document';

/**
 * POST /api/documents/upload
 * Upload a new document
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse multipart form data
    const formData = await req.formData();
    
    // Get file from form data
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }
    
    // Get case ID from form data
    const caseId = formData.get('caseId') as string;
    
    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }
    
    // Get document type from form data
    const documentType = formData.get('documentType') as string;
    
    if (!documentType || !Object.values(DocumentType).includes(documentType as DocumentType)) {
      return NextResponse.json(
        { error: 'Valid document type is required' },
        { status: 400 }
      );
    }
    
    // Get valid until date from form data (optional)
    const validUntil = formData.get('validUntil') as string | null;
    
    // Upload document
    const document = await uploadDocument(
      file,
      caseId,
      documentType as DocumentType,
      user.id,
      validUntil || undefined
    );
    
    return NextResponse.json(
      { document },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error uploading document:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}
