import { encryptData, decryptData } from './encryptionService';

/**
 * Data masking types
 */
export enum MaskingType {
  EMAIL = 'email',
  PHONE = 'phone',
  NAME = 'name',
  ADDRESS = 'address',
  CREDIT_CARD = 'credit_card',
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
  DATE_OF_BIRTH = 'date_of_birth',
  CUSTOM = 'custom'
}

/**
 * Mask an email address
 * Example: j***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  
  const username = parts[0];
  const domain = parts[1];
  
  if (username.length <= 1) return email;
  
  const maskedUsername = username.charAt(0) + '***';
  return `${maskedUsername}@${domain}`;
}

/**
 * Mask a phone number
 * Example: ***-***-1234
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove non-numeric characters
  const numericPhone = phone.replace(/\D/g, '');
  
  if (numericPhone.length < 4) return phone;
  
  // Keep last 4 digits
  const lastFour = numericPhone.slice(-4);
  const maskedPart = '*'.repeat(numericPhone.length - 4);
  
  // Format the masked phone number
  if (numericPhone.length === 10) {
    // Format as ***-***-1234
    return `${maskedPart.slice(0, 3)}-${maskedPart.slice(3)}-${lastFour}`;
  } else {
    // Just mask all but last 4 digits
    return `${maskedPart}-${lastFour}`;
  }
}

/**
 * Mask a name
 * Example: J*** D***
 */
export function maskName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  const parts = name.split(' ');
  
  return parts.map(part => {
    if (part.length <= 1) return part;
    return part.charAt(0) + '*'.repeat(part.length - 1);
  }).join(' ');
}

/**
 * Mask an address
 * Example: 1*** Main St, C***, State, Z***
 */
export function maskAddress(address: string): string {
  if (!address || typeof address !== 'string') return '';
  
  // Split address by commas or newlines
  const parts = address.split(/,|\n/).map(part => part.trim());
  
  return parts.map(part => {
    const words = part.split(' ');
    
    return words.map(word => {
      // Don't mask short words or state abbreviations
      if (word.length <= 2) return word;
      
      // Check if word is a number (like house number)
      if (/^\d+$/.test(word)) {
        return word.charAt(0) + '*'.repeat(word.length - 1);
      }
      
      // Check if word is a zip code
      if (/^\d{5}(-\d{4})?$/.test(word)) {
        return '*'.repeat(word.length);
      }
      
      // Otherwise mask the word
      return word.charAt(0) + '*'.repeat(word.length - 1);
    }).join(' ');
  }).join(', ');
}

/**
 * Mask a credit card number
 * Example: **** **** **** 1234
 */
export function maskCreditCard(creditCard: string): string {
  if (!creditCard || typeof creditCard !== 'string') return '';
  
  // Remove non-numeric characters
  const numericCard = creditCard.replace(/\D/g, '');
  
  if (numericCard.length < 4) return creditCard;
  
  // Keep last 4 digits
  const lastFour = numericCard.slice(-4);
  const maskedPart = '*'.repeat(numericCard.length - 4);
  
  // Format the masked credit card
  let formatted = '';
  for (let i = 0; i < maskedPart.length; i++) {
    formatted += maskedPart.charAt(i);
    if ((i + 1) % 4 === 0 && i < maskedPart.length - 1) {
      formatted += ' ';
    }
  }
  
  return `${formatted} ${lastFour}`;
}

/**
 * Mask a passport number
 * Example: ******1234
 */
export function maskPassport(passport: string): string {
  if (!passport || typeof passport !== 'string') return '';
  
  // Remove spaces
  const cleanPassport = passport.replace(/\s/g, '');
  
  if (cleanPassport.length < 4) return passport;
  
  // Keep last 4 characters
  const lastFour = cleanPassport.slice(-4);
  const maskedPart = '*'.repeat(cleanPassport.length - 4);
  
  return `${maskedPart}${lastFour}`;
}

/**
 * Mask a national ID
 * Example: ***-**-1234 (for SSN)
 */
export function maskNationalId(id: string): string {
  if (!id || typeof id !== 'string') return '';
  
  // Remove non-alphanumeric characters
  const cleanId = id.replace(/[^a-zA-Z0-9]/g, '');
  
  if (cleanId.length < 4) return id;
  
  // Keep last 4 characters
  const lastFour = cleanId.slice(-4);
  const maskedPart = '*'.repeat(cleanId.length - 4);
  
  // Format for SSN if it's 9 digits
  if (/^\d{9}$/.test(cleanId)) {
    return `***-**-${lastFour}`;
  }
  
  return `${maskedPart}${lastFour}`;
}

/**
 * Mask a date of birth
 * Example: **/**/1990
 */
export function maskDateOfBirth(dob: string): string {
  if (!dob || typeof dob !== 'string') return '';
  
  // Try to parse the date
  const date = new Date(dob);
  
  if (isNaN(date.getTime())) {
    // If not a valid date, just mask everything except the year
    const parts = dob.split(/[\/\-\.]/);
    if (parts.length === 3 && parts[2].length === 4) {
      return `**/**/${parts[2]}`;
    }
    return dob;
  }
  
  // Get the year
  const year = date.getFullYear();
  
  return `**/**/${year}`;
}

/**
 * Apply custom masking pattern
 * @param value The value to mask
 * @param pattern The pattern to apply (e.g., "X" for masked chars, "C" for custom char)
 * @param customChar The custom character to use (default: *)
 */
export function applyCustomMask(value: string, pattern: string, customChar: string = '*'): string {
  if (!value || typeof value !== 'string' || !pattern || typeof pattern !== 'string') return '';
  
  let result = '';
  let valueIndex = 0;
  
  for (let i = 0; i < pattern.length; i++) {
    if (valueIndex >= value.length) break;
    
    const patternChar = pattern.charAt(i);
    
    if (patternChar === 'X') {
      // Show the actual character
      result += value.charAt(valueIndex);
    } else if (patternChar === 'C') {
      // Replace with custom character
      result += customChar;
    } else {
      // Use the pattern character as a literal
      result += patternChar;
      // Don't increment valueIndex for literal characters
      continue;
    }
    
    valueIndex++;
  }
  
  return result;
}

/**
 * Mask a value based on its type
 */
export function maskValue(value: string, type: MaskingType, customPattern?: string): string {
  if (!value) return '';
  
  switch (type) {
    case MaskingType.EMAIL:
      return maskEmail(value);
    case MaskingType.PHONE:
      return maskPhone(value);
    case MaskingType.NAME:
      return maskName(value);
    case MaskingType.ADDRESS:
      return maskAddress(value);
    case MaskingType.CREDIT_CARD:
      return maskCreditCard(value);
    case MaskingType.PASSPORT:
      return maskPassport(value);
    case MaskingType.NATIONAL_ID:
      return maskNationalId(value);
    case MaskingType.DATE_OF_BIRTH:
      return maskDateOfBirth(value);
    case MaskingType.CUSTOM:
      if (!customPattern) return value;
      return applyCustomMask(value, customPattern);
    default:
      return value;
  }
}
