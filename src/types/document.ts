import { User } from './user';

export enum DocumentType {
  PASSPORT = 'PASSPORT',
  VISA = 'VISA',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  MARRIAGE_CERTIFICATE = 'MARRIAGE_CERTIFICATE',
  EDUCATION_CERTIFICATE = 'EDUCATION_CERTIFICATE',
  EMPLOYMENT_LETTER = 'EMPLOYMENT_LETTER',
  BANK_STATEMENT = 'BANK_STATEMENT',
  UTILITY_BILL = 'UTILITY_BILL',
  PHOTO = 'PHOTO',
  OTHER = 'OTHER'
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export interface Document {
  id: string;
  caseId: string;
  type: DocumentType;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  uploadedBy: string;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  user?: User;
}

export interface DocumentCreateData {
  caseId: string;
  type: DocumentType;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  validUntil?: Date;
}

export interface DocumentUpdateData {
  type?: DocumentType;
  status?: DocumentStatus;
  validUntil?: Date | null;
}

export interface DocumentValidationResult {
  isValid: boolean;
  issues: DocumentValidationIssue[];
  extractedData?: Record<string, any>;
  confidence: number;
}

export interface DocumentValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

export interface DocumentWithValidation extends Document {
  validationResults: DocumentValidationResult;
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.PASSPORT]: 'Passport',
  [DocumentType.VISA]: 'Visa',
  [DocumentType.BIRTH_CERTIFICATE]: 'Birth Certificate',
  [DocumentType.MARRIAGE_CERTIFICATE]: 'Marriage Certificate',
  [DocumentType.EDUCATION_CERTIFICATE]: 'Education Certificate',
  [DocumentType.EMPLOYMENT_LETTER]: 'Employment Letter',
  [DocumentType.BANK_STATEMENT]: 'Bank Statement',
  [DocumentType.UTILITY_BILL]: 'Utility Bill',
  [DocumentType.PHOTO]: 'Photo',
  [DocumentType.OTHER]: 'Other Document',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING]: 'Pending Review',
  [DocumentStatus.APPROVED]: 'Approved',
  [DocumentStatus.REJECTED]: 'Rejected',
  [DocumentStatus.EXPIRED]: 'Expired',
};
