import { DocumentType } from './document';

/**
 * Form Template Status
 */
export enum FormTemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
}

/**
 * Form Submission Status
 */
export enum FormSubmissionStatus {
  GENERATED = 'generated',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Signature Type
 */
export enum SignatureType {
  DRAWN = 'drawn',
  TYPED = 'typed',
  DIGITAL = 'digital',
}

/**
 * Form Template Interface
 */
export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: FormTemplateStatus;
  documentTypes: DocumentType[];
  requiredFields: string[];
  optionalFields: string[];
  fieldMappings: Record<string, string>;
  templateData: FormTemplateData;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

/**
 * Form Template Version Interface
 */
export interface FormTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  name: string;
  description?: string;
  status: FormTemplateStatus;
  documentTypes: DocumentType[];
  requiredFields: string[];
  optionalFields: string[];
  fieldMappings: Record<string, string>;
  templateData: FormTemplateData;
  createdBy: string;
  createdAt: Date;
}

/**
 * Form Template Data Interface
 * Defines the structure and layout of the form
 */
export interface FormTemplateData {
  title: string;
  sections: FormSection[];
  footer?: string;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  styling?: {
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

/**
 * Form Section Interface
 */
export interface FormSection {
  title?: string;
  description?: string;
  fields: FormField[];
}

/**
 * Form Field Interface
 */
export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  options?: string[]; // For select, radio, checkbox fields
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

/**
 * Form Field Type
 */
export enum FormFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  SIGNATURE = 'signature',
}

/**
 * Form Submission Interface
 */
export interface FormSubmission {
  id: string;
  templateId: string;
  templateVersion: number;
  caseId: string;
  userId: string;
  formData: Record<string, any>;
  filePath: string;
  fileName: string;
  fileSize: number;
  status: FormSubmissionStatus;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  signatures?: FormSignature[];
}

/**
 * Form Signature Interface
 */
export interface FormSignature {
  id: string;
  submissionId: string;
  userId: string;
  signatureData: string; // Base64 encoded signature image data
  signatureType: SignatureType;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Form Template Create Data
 */
export interface FormTemplateCreateData {
  name: string;
  description?: string;
  documentTypes: DocumentType[];
  requiredFields: string[];
  optionalFields: string[];
  fieldMappings: Record<string, string>;
  templateData: FormTemplateData;
}

/**
 * Form Template Update Data
 */
export interface FormTemplateUpdateData {
  name?: string;
  description?: string;
  status?: FormTemplateStatus;
  documentTypes?: DocumentType[];
  requiredFields?: string[];
  optionalFields?: string[];
  fieldMappings?: Record<string, string>;
  templateData?: FormTemplateData;
}

/**
 * Form Submission Create Data
 */
export interface FormSubmissionCreateData {
  templateId: string;
  caseId: string;
  formData: Record<string, any>;
  filePath: string;
  fileName: string;
  fileSize: number;
}

/**
 * Form Signature Create Data
 */
export interface FormSignatureCreateData {
  submissionId: string;
  signatureData: string;
  signatureType: SignatureType;
  ipAddress?: string;
  userAgent?: string;
}
