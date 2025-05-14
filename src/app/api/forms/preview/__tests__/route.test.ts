import { NextRequest } from 'next/server';
import { POST } from '../route';
import { getServerSession } from 'next-auth/next';
import * as formTemplateService from '@/services/form/formTemplateService';
import { generatePDFPreview } from '@/services/form/formPreviewService';
import { FormTemplateStatus, FormFieldType } from '@/types/form';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('@/services/form/formTemplateService');
jest.mock('@/services/form/formPreviewService');

describe('POST /api/forms/preview', () => {
  // Mock data
  const mockUserId = 'user-123';
  const mockTemplateId = 'template-123';
  const mockFormData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  };
  
  const mockTemplate = {
    id: mockTemplateId,
    name: 'Test Template',
    description: 'Test template description',
    status: FormTemplateStatus.ACTIVE,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: mockUserId,
    fields: [
      {
        id: 'field-1',
        name: 'firstName',
        label: 'First Name',
        type: FormFieldType.TEXT,
        required: true,
      },
      {
        id: 'field-2',
        name: 'lastName',
        label: 'Last Name',
        type: FormFieldType.TEXT,
        required: true,
      },
      {
        id: 'field-3',
        name: 'email',
        label: 'Email',
        type: FormFieldType.EMAIL,
        required: true,
      },
    ],
    requiredFields: ['firstName', 'lastName', 'email'],
    templateData: {
      title: 'Test Form',
      sections: [],
    },
  };
  
  // Mock request
  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: mockUserId,
      },
    });
    
    (formTemplateService.getFormTemplateById as jest.Mock).mockResolvedValue(mockTemplate);
    
    (generatePDFPreview as jest.Mock).mockResolvedValue({
      success: true,
      previewUrl: 'https://example.com/previews/preview-id/preview-file.pdf',
      previewId: 'preview-id',
    });
  });
  
  it('should successfully generate a form preview', async () => {
    const request = createMockRequest({
      templateId: mockTemplateId,
      formData: mockFormData,
    });
    
    const response = await POST(request);
    const responseData = await response.json();
    
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.previewUrl).toBe('https://example.com/previews/preview-id/preview-file.pdf');
    expect(responseData.previewId).toBe('preview-id');
    
    // Verify service calls
    expect(formTemplateService.getFormTemplateById).toHaveBeenCalledWith(mockTemplateId);
    expect(generatePDFPreview).toHaveBeenCalledWith(mockTemplate, mockFormData);
  });
  
  it('should return 401 if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    
    const request = createMockRequest({
      templateId: mockTemplateId,
      formData: mockFormData,
    });
    
    const response = await POST(request);
    const responseData = await response.json();
    
    expect(response.status).toBe(401);
    expect(responseData.error).toBe('Unauthorized');
  });
  
  it('should return 400 if template ID is missing', async () => {
    const request = createMockRequest({
      formData: mockFormData,
    });
    
    const response = await POST(request);
    const responseData = await response.json();
    
    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Template ID is required');
  });
  
  it('should return 400 if form data is missing', async () => {
    const request = createMockRequest({
      templateId: mockTemplateId,
    });
    
    const response = await POST(request);
    const responseData = await response.json();
    
    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Form data is required');
  });
  
  it('should return 404 if template is not found', async () => {
    (formTemplateService.getFormTemplateById as jest.Mock).mockResolvedValue(null);
    
    const request = createMockRequest({
      templateId: mockTemplateId,
      formData: mockFormData,
    });
    
    const response = await POST(request);
    const responseData = await response.json();
    
    expect(response.status).toBe(404);
    expect(responseData.error).toBe(`Template with ID ${mockTemplateId} not found`);
  });
  
  it('should return 400 if template is not available for preview', async () => {
    const inactiveTemplate = {
      ...mockTemplate,
      status: FormTemplateStatus.DEPRECATED,
    };
    
    (formTemplateService.getFormTemplateById as jest.Mock).mockResolvedValue(inactiveTemplate);
    
    const request = createMockRequest({
      templateId: mockTemplateId,
      formData: mockFormData,
    });
    
    const response = await POST(request);
    const responseData = await response.json();
    
    expect(response.status).toBe(400);
    expect(responseData.error).toBe(`Template with ID ${mockTemplateId} is not available for preview`);
  });
  
  it('should return 400 if required fields are missing', async () => {
    const request = createMockRequest({
      templateId: mockTemplateId,
      formData: {
        firstName: 'John',
        // Missing lastName and email
      },
    });
    
    const response = await POST(request);
    const responseData = await response.json();
    
    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Missing required fields');
    expect(responseData.missingFields).toContain('lastName');
    expect(responseData.missingFields).toContain('email');
  });
  
  it('should return 500 if preview generation fails', async () => {
    (generatePDFPreview as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Preview generation failed',
    });
    
    const request = createMockRequest({
      templateId: mockTemplateId,
      formData: mockFormData,
    });
    
    const response = await POST(request);
    const responseData = await response.json();
    
    expect(response.status).toBe(500);
    expect(responseData.error).toBe('Preview generation failed');
  });
});
