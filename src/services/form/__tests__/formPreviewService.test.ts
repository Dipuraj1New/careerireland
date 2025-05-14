import { generatePDFPreview } from '../formPreviewService';
import { uploadFile } from '@/services/storage/storageService';
import { FormTemplate, FormTemplateStatus, FormFieldType } from '@/types/form';

// Mock dependencies
jest.mock('@/services/storage/storageService');

describe('Form Preview Service', () => {
  // Mock data
  const mockTemplate: FormTemplate = {
    id: 'template-123',
    name: 'Test Template',
    description: 'Test template description',
    status: FormTemplateStatus.ACTIVE,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
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
      sections: [
        {
          title: 'Personal Information',
          description: 'Please provide your personal information',
          fields: [
            {
              name: 'firstName',
              label: 'First Name',
            },
            {
              name: 'lastName',
              label: 'Last Name',
            },
            {
              name: 'email',
              label: 'Email',
            },
          ],
        },
      ],
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      },
      styling: {
        fontSize: 12,
        lineHeight: 24,
        primaryColor: '#000000',
        secondaryColor: '#666666',
      },
      footer: 'Test Footer',
    },
  };
  
  const mockFormData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (uploadFile as jest.Mock).mockResolvedValue({
      success: true,
      filePath: 'previews/preview-id/preview-file.pdf',
      url: 'https://example.com/previews/preview-id/preview-file.pdf',
    });
  });
  
  it('should successfully generate a PDF preview', async () => {
    const result = await generatePDFPreview(mockTemplate, mockFormData);
    
    expect(result.success).toBe(true);
    expect(result.previewUrl).toBe('https://example.com/previews/preview-id/preview-file.pdf');
    expect(result.previewId).toBeDefined();
    
    // Verify uploadFile was called
    expect(uploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringContaining('previews/'),
      'application/pdf',
      'system',
      false,
      true
    );
  });
  
  it('should handle upload failure', async () => {
    (uploadFile as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Upload failed',
    });
    
    const result = await generatePDFPreview(mockTemplate, mockFormData);
    
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to upload preview');
  });
  
  it('should handle errors during PDF generation', async () => {
    // Create a template with invalid data to cause an error
    const invalidTemplate = {
      ...mockTemplate,
      templateData: null,
    } as unknown as FormTemplate;
    
    const result = await generatePDFPreview(invalidTemplate, mockFormData);
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('Preview generation failed');
  });
});
