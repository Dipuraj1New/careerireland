import { NextRequest, NextResponse } from 'next/server';
import { getDocument, updateDocumentStatus, removeDocument } from '@/services/document/documentService';
import { getUserFromRequest } from '@/lib/auth';
import { DocumentStatus } from '@/types/document';
import { UserRole } from '@/types/user';
import { z } from 'zod';

// Schema for document status update
const updateDocumentSchema = z.object({
  status: z.enum([
    DocumentStatus.PENDING,
    DocumentStatus.APPROVED,
    DocumentStatus.REJECTED,
    DocumentStatus.EXPIRED,
  ]),
  validUntil: z.string().optional(),
});

/**
 * GET /api/documents/:id
 * Get document by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get document by ID
    const document = await getDocument(params.id);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { document },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error getting document:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get document' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/:id
 * Update document status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only agents and admins can update document status
    if (user.role !== UserRole.AGENT && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate request body
    const validationResult = updateDocumentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // Update document status
    const document = await updateDocumentStatus(
      params.id,
      validationResult.data.status,
      validationResult.data.validUntil
    );
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { document },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating document:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to update document' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/:id
 * Delete document
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Delete document
    const deleted = await removeDocument(params.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting document:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}
