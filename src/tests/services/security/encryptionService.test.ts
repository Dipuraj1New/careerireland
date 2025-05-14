import {
  encryptData,
  decryptData,
  encryptTypedData,
  decryptTypedData,
  encryptObjectFields,
  decryptObjectFields,
  EncryptionDataType
} from '@/services/security/encryptionService';

// Mock the database and key management
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  getClient: jest.fn().mockReturnValue({
    query: jest.fn(),
    release: jest.fn()
  })
}));

// Mock the active encryption key
jest.mock('@/services/security/encryptionService', () => {
  // Create a real key for testing
  const crypto = require('crypto');
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  // Store encrypted data for tests
  const encryptedData = new Map();
  
  // Create the actual implementation
  const original = jest.requireActual('@/services/security/encryptionService');
  
  return {
    ...original,
    // Override these functions with test implementations
    getActiveEncryptionKey: jest.fn().mockResolvedValue({
      id: 'test-key-id',
      keyIdentifier: 'test-key-identifier',
      encryptedKey: 'test-encrypted-key',
      isActive: true,
      createdAt: new Date(),
      rotationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    }),
    getEncryptionKeyByIdentifier: jest.fn().mockResolvedValue({
      id: 'test-key-id',
      keyIdentifier: 'test-key-identifier',
      encryptedKey: 'test-encrypted-key',
      isActive: true,
      createdAt: new Date(),
      rotationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    }),
    encryptWithMasterKey: jest.fn().mockReturnValue('encrypted-with-master-key'),
    decryptWithMasterKey: jest.fn().mockReturnValue(key),
    EncryptionDataType: original.EncryptionDataType
  };
});

describe('Encryption Service', () => {
  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt string data correctly', async () => {
      const originalData = 'test-data';
      
      const { encryptedData, keyIdentifier } = await encryptData(originalData);
      expect(encryptedData).toBeDefined();
      expect(keyIdentifier).toBe('test-key-identifier');
      
      const decryptedData = await decryptData(encryptedData, keyIdentifier);
      expect(decryptedData).toBe(originalData);
    });
    
    it('should use context for authenticated encryption', async () => {
      const originalData = 'test-data';
      const context = 'test-context';
      
      const { encryptedData, keyIdentifier } = await encryptData(originalData, context);
      
      // Should decrypt with the same context
      const decryptedData = await decryptData(encryptedData, keyIdentifier, context);
      expect(decryptedData).toBe(originalData);
      
      // Should fail with a different context
      await expect(
        decryptData(encryptedData, keyIdentifier, 'wrong-context')
      ).rejects.toThrow();
    });
  });
  
  describe('encryptTypedData and decryptTypedData', () => {
    it('should encrypt and decrypt string data correctly', async () => {
      const originalData = 'test-string';
      
      const { encryptedData, keyIdentifier } = await encryptTypedData(
        originalData, 
        EncryptionDataType.STRING
      );
      
      const { data, dataType } = await decryptTypedData(
        encryptedData, 
        keyIdentifier, 
        EncryptionDataType.STRING
      );
      
      expect(data).toBe(originalData);
      expect(dataType).toBe(EncryptionDataType.STRING);
    });
    
    it('should encrypt and decrypt number data correctly', async () => {
      const originalData = 12345;
      
      const { encryptedData, keyIdentifier } = await encryptTypedData(
        originalData, 
        EncryptionDataType.NUMBER
      );
      
      const { data, dataType } = await decryptTypedData(
        encryptedData, 
        keyIdentifier, 
        EncryptionDataType.NUMBER
      );
      
      expect(data).toBe(originalData);
      expect(dataType).toBe(EncryptionDataType.NUMBER);
    });
    
    it('should encrypt and decrypt boolean data correctly', async () => {
      const originalData = true;
      
      const { encryptedData, keyIdentifier } = await encryptTypedData(
        originalData, 
        EncryptionDataType.BOOLEAN
      );
      
      const { data, dataType } = await decryptTypedData(
        encryptedData, 
        keyIdentifier, 
        EncryptionDataType.BOOLEAN
      );
      
      expect(data).toBe(originalData);
      expect(dataType).toBe(EncryptionDataType.BOOLEAN);
    });
    
    it('should encrypt and decrypt date data correctly', async () => {
      const originalData = new Date('2023-01-01');
      
      const { encryptedData, keyIdentifier } = await encryptTypedData(
        originalData, 
        EncryptionDataType.DATE
      );
      
      const { data, dataType } = await decryptTypedData(
        encryptedData, 
        keyIdentifier, 
        EncryptionDataType.DATE
      );
      
      expect(data.getTime()).toBe(originalData.getTime());
      expect(dataType).toBe(EncryptionDataType.DATE);
    });
    
    it('should encrypt and decrypt object data correctly', async () => {
      const originalData = { name: 'John', age: 30 };
      
      const { encryptedData, keyIdentifier } = await encryptTypedData(
        originalData, 
        EncryptionDataType.OBJECT
      );
      
      const { data, dataType } = await decryptTypedData(
        encryptedData, 
        keyIdentifier, 
        EncryptionDataType.OBJECT
      );
      
      expect(data).toEqual(originalData);
      expect(dataType).toBe(EncryptionDataType.OBJECT);
    });
    
    it('should encrypt and decrypt array data correctly', async () => {
      const originalData = [1, 2, 3, 'test'];
      
      const { encryptedData, keyIdentifier } = await encryptTypedData(
        originalData, 
        EncryptionDataType.ARRAY
      );
      
      const { data, dataType } = await decryptTypedData(
        encryptedData, 
        keyIdentifier, 
        EncryptionDataType.ARRAY
      );
      
      expect(data).toEqual(originalData);
      expect(dataType).toBe(EncryptionDataType.ARRAY);
    });
  });
  
  describe('encryptObjectFields and decryptObjectFields', () => {
    it('should encrypt and decrypt specific fields in an object', async () => {
      const originalObject = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        address: '123 Main St',
        publicField: 'This is public'
      };
      
      const fieldsToEncrypt = {
        email: EncryptionDataType.STRING,
        phone: EncryptionDataType.STRING,
        address: EncryptionDataType.STRING
      };
      
      const { encryptedObject, encryptionMetadata } = await encryptObjectFields(
        originalObject,
        fieldsToEncrypt
      );
      
      // Check that specified fields are encrypted
      expect(encryptedObject.email).not.toBe(originalObject.email);
      expect(encryptedObject.phone).not.toBe(originalObject.phone);
      expect(encryptedObject.address).not.toBe(originalObject.address);
      
      // Check that non-specified fields are not encrypted
      expect(encryptedObject.id).toBe(originalObject.id);
      expect(encryptedObject.name).toBe(originalObject.name);
      expect(encryptedObject.publicField).toBe(originalObject.publicField);
      
      // Check encryption metadata
      expect(Object.keys(encryptionMetadata)).toEqual(['email', 'phone', 'address']);
      
      // Decrypt the object
      const decryptedObject = await decryptObjectFields(
        encryptedObject,
        encryptionMetadata
      );
      
      // Check that all fields are restored correctly
      expect(decryptedObject).toEqual(originalObject);
    });
    
    it('should handle missing fields gracefully', async () => {
      const originalObject = {
        id: '123',
        name: 'John Doe'
      };
      
      const fieldsToEncrypt = {
        email: EncryptionDataType.STRING,
        phone: EncryptionDataType.STRING
      };
      
      const { encryptedObject, encryptionMetadata } = await encryptObjectFields(
        originalObject,
        fieldsToEncrypt
      );
      
      // Check that object is unchanged
      expect(encryptedObject).toEqual(originalObject);
      
      // Check that metadata is empty
      expect(Object.keys(encryptionMetadata)).toEqual([]);
    });
  });
});
