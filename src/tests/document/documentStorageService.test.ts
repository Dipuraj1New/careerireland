import { v4 as uuidv4 } from 'uuid';
import supabase from '@/lib/supabase';
import { 
  initializeStorage, 
  uploadFile, 
  getFileUrl, 
  deleteFile 
} from '@/services/document/documentStorageService';
import { MAX_FILE_SIZE } from '@/types/document';

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  storage: {
    listBuckets: jest.fn(),
    createBucket: jest.fn(),
    from: jest.fn().mockReturnValue({
      upload: jest.fn(),
      createSignedUrl: jest.fn(),
      remove: jest.fn(),
    }),
  },
}));

describe('Document Storage Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('initializeStorage', () => {
    it('should create bucket if it does not exist', async () => {
      // Mock Supabase response
      (supabase.storage.listBuckets as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });
      
      (supabase.storage.createBucket as jest.Mock).mockResolvedValue({
        data: { name: 'documents' },
        error: null,
      });
      
      // Call the function
      await initializeStorage();
      
      // Assertions
      expect(supabase.storage.listBuckets).toHaveBeenCalledTimes(1);
      expect(supabase.storage.createBucket).toHaveBeenCalledTimes(1);
      expect(supabase.storage.createBucket).toHaveBeenCalledWith('documents', {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE,
      });
    });
    
    it('should not create bucket if it already exists', async () => {
      // Mock Supabase response
      (supabase.storage.listBuckets as jest.Mock).mockResolvedValue({
        data: [{ name: 'documents' }],
        error: null,
      });
      
      // Call the function
      await initializeStorage();
      
      // Assertions
      expect(supabase.storage.listBuckets).toHaveBeenCalledTimes(1);
      expect(supabase.storage.createBucket).not.toHaveBeenCalled();
    });
  });
  
  describe('uploadFile', () => {
    it('should upload a file and return file path and size', async () => {
      // Mock data
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const caseId = uuidv4();
      const userId = uuidv4();
      
      // Mock Supabase response
      const mockUpload = supabase.storage.from('documents').upload as jest.Mock;
      mockUpload.mockResolvedValue({
        data: { path: `${caseId}/test.pdf` },
        error: null,
      });
      
      // Call the function
      const result = await uploadFile(file, caseId, userId);
      
      // Assertions
      expect(mockUpload).toHaveBeenCalledTimes(1);
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining(caseId),
        file,
        expect.any(Object)
      );
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('fileSize', file.size);
    });
    
    it('should throw error for invalid file type', async () => {
      // Mock data
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const caseId = uuidv4();
      const userId = uuidv4();
      
      // Call the function and expect error
      await expect(uploadFile(file, caseId, userId)).rejects.toThrow('Invalid file type');
    });
    
    it('should throw error for file too large', async () => {
      // Create a mock file that exceeds the size limit
      const file = {
        name: 'large.pdf',
        type: 'application/pdf',
        size: MAX_FILE_SIZE + 1,
      } as File;
      
      const caseId = uuidv4();
      const userId = uuidv4();
      
      // Call the function and expect error
      await expect(uploadFile(file, caseId, userId)).rejects.toThrow('File too large');
    });
  });
  
  describe('getFileUrl', () => {
    it('should return a signed URL for a file', async () => {
      // Mock data
      const filePath = 'path/to/file.pdf';
      const signedUrl = 'https://example.com/signed-url';
      
      // Mock Supabase response
      const mockCreateSignedUrl = supabase.storage.from('documents').createSignedUrl as jest.Mock;
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl },
        error: null,
      });
      
      // Call the function
      const result = await getFileUrl(filePath);
      
      // Assertions
      expect(mockCreateSignedUrl).toHaveBeenCalledTimes(1);
      expect(mockCreateSignedUrl).toHaveBeenCalledWith(filePath, 60 * 60);
      expect(result).toBe(signedUrl);
    });
    
    it('should throw error when signed URL creation fails', async () => {
      // Mock data
      const filePath = 'path/to/file.pdf';
      
      // Mock Supabase response
      const mockCreateSignedUrl = supabase.storage.from('documents').createSignedUrl as jest.Mock;
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Failed to create signed URL' },
      });
      
      // Call the function and expect error
      await expect(getFileUrl(filePath)).rejects.toThrow('Failed to get file URL');
    });
  });
  
  describe('deleteFile', () => {
    it('should delete a file', async () => {
      // Mock data
      const filePath = 'path/to/file.pdf';
      
      // Mock Supabase response
      const mockRemove = supabase.storage.from('documents').remove as jest.Mock;
      mockRemove.mockResolvedValue({
        data: { path: filePath },
        error: null,
      });
      
      // Call the function
      await deleteFile(filePath);
      
      // Assertions
      expect(mockRemove).toHaveBeenCalledTimes(1);
      expect(mockRemove).toHaveBeenCalledWith([filePath]);
    });
    
    it('should throw error when file deletion fails', async () => {
      // Mock data
      const filePath = 'path/to/file.pdf';
      
      // Mock Supabase response
      const mockRemove = supabase.storage.from('documents').remove as jest.Mock;
      mockRemove.mockResolvedValue({
        data: null,
        error: { message: 'Failed to delete file' },
      });
      
      // Call the function and expect error
      await expect(deleteFile(filePath)).rejects.toThrow('Failed to delete file');
    });
  });
});
