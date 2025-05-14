import {
  maskEmail,
  maskPhone,
  maskName,
  maskAddress,
  maskCreditCard,
  maskPassport,
  maskNationalId,
  maskDateOfBirth,
  applyCustomMask,
  maskValue,
  MaskingType
} from '@/services/security/dataMaskingService';

describe('Data Masking Service', () => {
  describe('maskEmail', () => {
    it('should mask email addresses correctly', () => {
      expect(maskEmail('john.doe@example.com')).toBe('j***@example.com');
      expect(maskEmail('jane@test.org')).toBe('j***@test.org');
      expect(maskEmail('a@b.com')).toBe('a@b.com'); // Too short to mask
      expect(maskEmail('')).toBe('');
      expect(maskEmail('invalid-email')).toBe('invalid-email');
    });
  });

  describe('maskPhone', () => {
    it('should mask phone numbers correctly', () => {
      expect(maskPhone('1234567890')).toBe('***-***-7890');
      expect(maskPhone('123-456-7890')).toBe('***-***-7890');
      expect(maskPhone('+1 (123) 456-7890')).toBe('***-***-7890');
      expect(maskPhone('123')).toBe('123'); // Too short to mask
      expect(maskPhone('')).toBe('');
    });
  });

  describe('maskName', () => {
    it('should mask names correctly', () => {
      expect(maskName('John Doe')).toBe('J*** D**');
      expect(maskName('Jane Smith-Johnson')).toBe('J*** S****-J******');
      expect(maskName('J D')).toBe('J D'); // Too short to mask
      expect(maskName('')).toBe('');
    });
  });

  describe('maskAddress', () => {
    it('should mask addresses correctly', () => {
      expect(maskAddress('123 Main St, City, State, 12345'))
        .toBe('1** M*** S*, C***, State, *****');
      expect(maskAddress('Apt 4B, 567 Oak Ave, Town, TX, 67890'))
        .toBe('A** 4B, 5** O** A**, T***, TX, *****');
      expect(maskAddress('')).toBe('');
    });
  });

  describe('maskCreditCard', () => {
    it('should mask credit card numbers correctly', () => {
      expect(maskCreditCard('4111111111111111')).toBe('************ 1111');
      expect(maskCreditCard('4111-1111-1111-1111')).toBe('************ 1111');
      expect(maskCreditCard('411')).toBe('411'); // Too short to mask
      expect(maskCreditCard('')).toBe('');
    });
  });

  describe('maskPassport', () => {
    it('should mask passport numbers correctly', () => {
      expect(maskPassport('AB1234567')).toBe('*****4567');
      expect(maskPassport('A12345')).toBe('**2345');
      expect(maskPassport('123')).toBe('123'); // Too short to mask
      expect(maskPassport('')).toBe('');
    });
  });

  describe('maskNationalId', () => {
    it('should mask national IDs correctly', () => {
      expect(maskNationalId('123-45-6789')).toBe('***-**-6789'); // SSN format
      expect(maskNationalId('123456789')).toBe('***-**-6789'); // SSN digits only
      expect(maskNationalId('AB123456')).toBe('***3456'); // Other format
      expect(maskNationalId('123')).toBe('123'); // Too short to mask
      expect(maskNationalId('')).toBe('');
    });
  });

  describe('maskDateOfBirth', () => {
    it('should mask dates of birth correctly', () => {
      expect(maskDateOfBirth('1990-01-01')).toBe('**/*/1990');
      expect(maskDateOfBirth('01/01/1990')).toBe('**/*/1990');
      expect(maskDateOfBirth('Jan 1, 1990')).toBe('**/*/1990');
      expect(maskDateOfBirth('01.01.1990')).toBe('**/*/1990');
      expect(maskDateOfBirth('')).toBe('');
    });
  });

  describe('applyCustomMask', () => {
    it('should apply custom masking patterns correctly', () => {
      expect(applyCustomMask('1234567890', 'XXX-XX-CCCC')).toBe('123-45-****');
      expect(applyCustomMask('ABC123', 'X-CCC-X')).toBe('A-***-C');
      expect(applyCustomMask('', 'XXXX')).toBe('');
    });
  });

  describe('maskValue', () => {
    it('should mask values based on masking type', () => {
      expect(maskValue('john.doe@example.com', MaskingType.EMAIL)).toBe('j***@example.com');
      expect(maskValue('123-456-7890', MaskingType.PHONE)).toBe('***-***-7890');
      expect(maskValue('John Doe', MaskingType.NAME)).toBe('J*** D**');
      expect(maskValue('4111111111111111', MaskingType.CREDIT_CARD)).toBe('************ 1111');
      expect(maskValue('AB1234567', MaskingType.PASSPORT)).toBe('*****4567');
      expect(maskValue('123-45-6789', MaskingType.NATIONAL_ID)).toBe('***-**-6789');
      expect(maskValue('1990-01-01', MaskingType.DATE_OF_BIRTH)).toBe('**/*/1990');
      
      // Custom masking with pattern
      expect(maskValue('1234567890', MaskingType.CUSTOM, 'XXX-XX-CCCC')).toBe('123-45-****');
      
      // Unknown masking type
      expect(maskValue('test', 'unknown' as MaskingType)).toBe('test');
    });
  });
});
