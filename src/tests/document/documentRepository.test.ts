import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { 
  createDocument, 
  getDocumentById, 
  getDocumentsByCaseId, 
  updateDocument, 
  deleteDocument 
} from '@/services/document/documentRepository';
import { DocumentStatus, DocumentType } from '@/types/document';

// Mock the database module
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

describe('Document Repository', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createDocument', () => {
    it('should create a document and return it', async () => {
      // Mock data
      const documentId = uuidv4();
      const now = new Date();
      const documentData = {
        caseId: uuidv4(),
        type: DocumentType.PASSPORT,
        filePath: 'path/to/file.pdf',
        fileName: 'passport.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedBy: uuidv4(),
      };
      
      // Mock database response
      const mockDbResponse = {
        rows: [{
          id: documentId,
          case_id: documentData.caseId,
          type: documentData.type,
          status: DocumentStatus.PENDING,
          file_path: documentData.filePath,
          file_name: documentData.fileName,
          file_size: documentData.fileSize,
          mime_type: documentData.mimeType,
          uploaded_by: documentData.uploadedBy,
          valid_until: null,
          version: 1,
          is_deleted: false,
          created_at: now,
          updated_at: now,
        }],
      };
      
      (db.query as jest.Mock).mockResolvedValue(mockDbResponse);
      
      // Call the function
      const result = await createDocument(documentData);
      
      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: documentId,
        caseId: documentData.caseId,
        type: documentData.type,
        status: DocumentStatus.PENDING,
        filePath: documentData.filePath,
        fileName: documentData.fileName,
        fileSize: documentData.fileSize,
        mimeType: documentData.mimeType,
        uploadedBy: documentData.uploadedBy,
        version: 1,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
    });
  });
  
  describe('getDocumentById', () => {
    it('should return a document when found', async () => {
      // Mock data
      const documentId = uuidv4();
      const now = new Date();
      
      // Mock database response
      const mockDbResponse = {
        rows: [{
          id: documentId,
          case_id: uuidv4(),
          type: DocumentType.PASSPORT,
          status: DocumentStatus.PENDING,
          file_path: 'path/to/file.pdf',
          file_name: 'passport.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          uploaded_by: uuidv4(),
          valid_until: null,
          version: 1,
          is_deleted: false,
          created_at: now,
          updated_at: now,
        }],
      };
      
      (db.query as jest.Mock).mockResolvedValue(mockDbResponse);
      
      // Call the function
      const result = await getDocumentById(documentId);
      
      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [documentId]
      );
      expect(result).not.toBeNull();
      expect(result?.id).toBe(documentId);
    });
    
    it('should return null when document not found', async () => {
      // Mock database response
      const mockDbResponse = { rows: [] };
      
      (db.query as jest.Mock).mockResolvedValue(mockDbResponse);
      
      // Call the function
      const result = await getDocumentById(uuidv4());
      
      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });
  
  describe('getDocumentsByCaseId', () => {
    it('should return documents for a case', async () => {
      // Mock data
      const caseId = uuidv4();
      const now = new Date();
      
      // Mock database response
      const mockDbResponse = {
        rows: [
          {
            id: uuidv4(),
            case_id: caseId,
            type: DocumentType.PASSPORT,
            status: DocumentStatus.PENDING,
            file_path: 'path/to/file1.pdf',
            file_name: 'passport.pdf',
            file_size: 1024,
            mime_type: 'application/pdf',
            uploaded_by: uuidv4(),
            valid_until: null,
            version: 1,
            is_deleted: false,
            created_at: now,
            updated_at: now,
          },
          {
            id: uuidv4(),
            case_id: caseId,
            type: DocumentType.FINANCIAL,
            status: DocumentStatus.PENDING,
            file_path: 'path/to/file2.pdf',
            file_name: 'bank_statement.pdf',
            file_size: 2048,
            mime_type: 'application/pdf',
            uploaded_by: uuidv4(),
            valid_until: null,
            version: 1,
            is_deleted: false,
            created_at: now,
            updated_at: now,
          },
        ],
      };
      
      (db.query as jest.Mock).mockResolvedValue(mockDbResponse);
      
      // Call the function
      const result = await getDocumentsByCaseId(caseId);
      
      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE case_id = $1'),
        [caseId]
      );
      expect(result).toHaveLength(2);
      expect(result[0].caseId).toBe(caseId);
      expect(result[1].caseId).toBe(caseId);
    });
  });
  
  describe('updateDocument', () => {
    it('should update document status', async () => {
      // Mock data
      const documentId = uuidv4();
      const now = new Date();
      
      // Mock database response
      const mockDbResponse = {
        rows: [{
          id: documentId,
          case_id: uuidv4(),
          type: DocumentType.PASSPORT,
          status: DocumentStatus.APPROVED,
          file_path: 'path/to/file.pdf',
          file_name: 'passport.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          uploaded_by: uuidv4(),
          valid_until: null,
          version: 1,
          is_deleted: false,
          created_at: now,
          updated_at: now,
        }],
      };
      
      (db.query as jest.Mock).mockResolvedValue(mockDbResponse);
      
      // Call the function
      const result = await updateDocument(documentId, { status: DocumentStatus.APPROVED });
      
      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(DocumentStatus.APPROVED);
    });
  });
  
  describe('deleteDocument', () => {
    it('should soft delete a document', async () => {
      // Mock data
      const documentId = uuidv4();
      
      // Mock database response
      const mockDbResponse = {
        rows: [{ id: documentId }],
      };
      
      (db.query as jest.Mock).mockResolvedValue(mockDbResponse);
      
      // Call the function
      const result = await deleteDocument(documentId);
      
      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SET is_deleted = TRUE'),
        expect.arrayContaining([documentId])
      );
      expect(result).toBe(true);
    });
    
    it('should return false when document not found', async () => {
      // Mock database response
      const mockDbResponse = { rows: [] };
      
      (db.query as jest.Mock).mockResolvedValue(mockDbResponse);
      
      // Call the function
      const result = await deleteDocument(uuidv4());
      
      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });
  });
});
