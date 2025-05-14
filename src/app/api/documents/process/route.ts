import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDocumentById } from '@/services/document/documentRepository';
import { processDocument } from '@/services/ai/documentProcessingController';
import { DocumentProcessingRequest } from '@/types/document';

/**
 * POST /api/documents/process
 * Process a document with AI
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body: DocumentProcessingRequest = await request.json();
    const { documentId, forceReprocess, documentType } = body;
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    // Get document
    const document = await getDocumentById(documentId);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to the document
    // For applicants, they should only be able to process their own documents
    // For agents and admins, they should be able to process any document
    if (user.role === 'applicant' && document.uploadedBy !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Process document
    const result = await processDocument(documentId, {
      forceReprocess,
      documentType,
      userId: user.id,
    });
    
    return NextResponse.json(
      { result },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
