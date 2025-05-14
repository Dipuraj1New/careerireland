import { NextRequest } from 'next/server';
import { POST } from '../route';
import { getServerSession } from 'next-auth/next';
import { verifySignature } from '@/services/form/formSignatureService';
import { getFormSubmissionById } from '@/services/form/formGenerationService';
import { getCaseById } from '@/services/case/caseService';
import { UserRole } from '@/types/user';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('@/services/form/formSignatureService');
jest.mock('@/services/form/formGenerationService');
jest.mock('@/services/case/caseService');

describe('POST /api/forms/submissions/:id/signatures/:signatureId/verify', () => {
  // Mock data
  const mockUserId = 'user-123';
  const mockSubmissionId = 'submission-123';
  const mockSignatureId = 'signature-123';
  const mockCaseId = 'case-123';
  
  // Mock request
  const createMockRequest = () => {
    return {
      headers: {
        get: jest.fn(() => null),
      },
    } as unknown as NextRequest;
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: mockUserId,
        role: UserRole.APPLICANT,
      },
    });
    
    (getFormSubmissionById as jest.Mock).mockResolvedValue({
      id: mockSubmissionId,
      caseId: mockCaseId,
    });
    
    (getCaseById as jest.Mock).mockResolvedValue({
      id: mockCaseId,
      applicantId: mockUserId,
    });
    
    (verifySignature as jest.Mock).mockResolvedValue({
      success: true,
      verified: true,
      message: 'Signature verification successful',
      details: {
        signatureId: mockSignatureId,
        submissionId: mockSubmissionId,
      },
    });
  });
  
  it('should successfully verify a signature', async () => {
    const request = createMockRequest();
    
    const response = await POST(request, { 
      params: { 
        id: mockSubmissionId,
        signatureId: mockSignatureId,
      } 
    });
    const responseData = await response.json();
    
    expect(response.status).toBe(200);
    expect(responseData.verified).toBe(true);
    expect(responseData.message).toBe('Signature verification successful');
    expect(responseData.details).toBeDefined();
    
    // Verify service calls
    expect(getFormSubmissionById).toHaveBeenCalledWith(mockSubmissionId);
    expect(getCaseById).toHaveBeenCalledWith(mockCaseId);
    expect(verifySignature).toHaveBeenCalledWith(
      mockSubmissionId,
      mockSignatureId,
      mockUserId
    );
  });
  
  it('should return 401 if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    
    const request = createMockRequest();
    
    const response = await POST(request, { 
      params: { 
        id: mockSubmissionId,
        signatureId: mockSignatureId,
      } 
    });
    const responseData = await response.json();
    
    expect(response.status).toBe(401);
    expect(responseData.error).toBe('Unauthorized');
  });
  
  it('should return 404 if submission is not found', async () => {
    (getFormSubmissionById as jest.Mock).mockResolvedValue(null);
    
    const request = createMockRequest();
    
    const response = await POST(request, { 
      params: { 
        id: mockSubmissionId,
        signatureId: mockSignatureId,
      } 
    });
    const responseData = await response.json();
    
    expect(response.status).toBe(404);
    expect(responseData.error).toBe('Submission not found');
  });
  
  it('should return 403 if user does not have access to the case', async () => {
    (getCaseById as jest.Mock).mockResolvedValue({
      id: mockCaseId,
      applicantId: 'different-user-id',
    });
    
    const request = createMockRequest();
    
    const response = await POST(request, { 
      params: { 
        id: mockSubmissionId,
        signatureId: mockSignatureId,
      } 
    });
    const responseData = await response.json();
    
    expect(response.status).toBe(403);
    expect(responseData.error).toBe('Forbidden');
  });
  
  it('should return 400 if verification fails', async () => {
    (verifySignature as jest.Mock).mockResolvedValue({
      success: false,
      verified: false,
      message: 'Signature verification failed',
    });
    
    const request = createMockRequest();
    
    const response = await POST(request, { 
      params: { 
        id: mockSubmissionId,
        signatureId: mockSignatureId,
      } 
    });
    const responseData = await response.json();
    
    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Signature verification failed');
  });
});
