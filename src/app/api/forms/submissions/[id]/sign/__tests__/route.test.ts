import { NextRequest } from 'next/server';
import { POST } from '../route';
import { getServerSession } from 'next-auth/next';
import formSignatureService from '@/services/form/formSignatureService';
import formGenerationService from '@/services/form/formGenerationService';
import { getCaseById } from '@/services/case/caseService';
import { UserRole } from '@/types/user';
import { SignatureType } from '@/types/form';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('@/services/form/formSignatureService');
jest.mock('@/services/form/formGenerationService');
jest.mock('@/services/case/caseService');

describe('POST /api/forms/submissions/:id/sign', () => {
  // Mock data
  const mockUserId = 'user-123';
  const mockSubmissionId = 'submission-123';
  const mockCaseId = 'case-123';
  const mockSignatureData = 'data:image/png;base64,test';
  
  // Mock request
  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: {
        get: jest.fn((name) => {
          if (name === 'x-forwarded-for' || name === 'x-real-ip') return '127.0.0.1';
          if (name === 'user-agent') return 'Jest Test Agent';
          return null;
        }),
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
    
    (formGenerationService.getFormSubmissionById as jest.Mock).mockResolvedValue({
      id: mockSubmissionId,
      caseId: mockCaseId,
    });
    
    (getCaseById as jest.Mock).mockResolvedValue({
      id: mockCaseId,
      applicantId: mockUserId,
    });
    
    (formSignatureService.signForm as jest.Mock).mockResolvedValue({
      success: true,
      signature: {
        id: 'signature-123',
        submissionId: mockSubmissionId,
        userId: mockUserId,
        signatureData: mockSignatureData,
        signatureType: SignatureType.DRAWN,
      },
    });
  });
  
  it('should successfully sign a form', async () => {
    const request = createMockRequest({
      signatureData: mockSignatureData,
      signatureType: SignatureType.DRAWN,
    });
    
    const response = await POST(request, { params: { id: mockSubmissionId } });
    const responseData = await response.json();
    
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.signature).toBeDefined();
    
    // Verify service calls
    expect(formGenerationService.getFormSubmissionById).toHaveBeenCalledWith(mockSubmissionId);
    expect(getCaseById).toHaveBeenCalledWith(mockCaseId);
    expect(formSignatureService.signForm).toHaveBeenCalledWith(
      mockSubmissionId,
      mockSignatureData,
      SignatureType.DRAWN,
      mockUserId,
      '127.0.0.1',
      'Jest Test Agent'
    );
  });
  
  it('should return 401 if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    
    const request = createMockRequest({
      signatureData: mockSignatureData,
    });
    
    const response = await POST(request, { params: { id: mockSubmissionId } });
    const responseData = await response.json();
    
    expect(response.status).toBe(401);
    expect(responseData.error).toBe('Unauthorized');
  });
  
  it('should return 404 if submission is not found', async () => {
    (formGenerationService.getFormSubmissionById as jest.Mock).mockResolvedValue(null);
    
    const request = createMockRequest({
      signatureData: mockSignatureData,
    });
    
    const response = await POST(request, { params: { id: mockSubmissionId } });
    const responseData = await response.json();
    
    expect(response.status).toBe(404);
    expect(responseData.error).toBe('Submission not found');
  });
  
  it('should return 403 if user does not have access to the case', async () => {
    (getCaseById as jest.Mock).mockResolvedValue({
      id: mockCaseId,
      applicantId: 'different-user-id',
    });
    
    const request = createMockRequest({
      signatureData: mockSignatureData,
    });
    
    const response = await POST(request, { params: { id: mockSubmissionId } });
    const responseData = await response.json();
    
    expect(response.status).toBe(403);
    expect(responseData.error).toBe('Forbidden');
  });
  
  it('should return 400 if signature data is missing', async () => {
    const request = createMockRequest({});
    
    const response = await POST(request, { params: { id: mockSubmissionId } });
    const responseData = await response.json();
    
    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Signature data is required');
  });
  
  it('should return 400 if signing fails', async () => {
    (formSignatureService.signForm as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Form signing failed',
    });
    
    const request = createMockRequest({
      signatureData: mockSignatureData,
    });
    
    const response = await POST(request, { params: { id: mockSubmissionId } });
    const responseData = await response.json();
    
    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Form signing failed');
  });
});
