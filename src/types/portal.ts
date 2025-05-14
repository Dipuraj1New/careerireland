/**
 * Types for government portal integration
 */

import { FormSubmissionStatus } from './form';

/**
 * Government portal types
 */
export enum GovernmentPortalType {
  IRISH_IMMIGRATION = 'IRISH_IMMIGRATION',
  IRISH_VISA = 'IRISH_VISA',
  GNIB = 'GNIB',
  EMPLOYMENT_PERMIT = 'EMPLOYMENT_PERMIT',
}

/**
 * Portal field mapping
 */
export interface PortalFieldMapping {
  id: string;
  portalType: GovernmentPortalType;
  formField: string;
  portalField: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Portal field mapping create data
 */
export interface PortalFieldMappingCreateData {
  portalType: GovernmentPortalType;
  formField: string;
  portalField: string;
}

/**
 * Portal field mapping update data
 */
export interface PortalFieldMappingUpdateData {
  portalField?: string;
}

/**
 * Portal submission status
 */
export enum PortalSubmissionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  RETRY_SCHEDULED = 'RETRY_SCHEDULED',
  COMPLETED = 'COMPLETED',
}

/**
 * Portal submission
 */
export interface PortalSubmission {
  id: string;
  formSubmissionId: string;
  portalType: GovernmentPortalType;
  status: PortalSubmissionStatus;
  confirmationNumber?: string;
  confirmationReceiptUrl?: string;
  errorMessage?: string;
  retryCount: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Portal submission create data
 */
export interface PortalSubmissionCreateData {
  formSubmissionId: string;
  portalType: GovernmentPortalType;
}

/**
 * Portal submission update data
 */
export interface PortalSubmissionUpdateData {
  status?: PortalSubmissionStatus;
  confirmationNumber?: string;
  confirmationReceiptUrl?: string;
  errorMessage?: string;
  retryCount?: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
}

/**
 * Portal credentials
 */
export interface PortalCredentials {
  username: string;
  password: string;
}

/**
 * Portal submission result
 */
export interface PortalSubmissionResult {
  success: boolean;
  status: PortalSubmissionStatus;
  confirmationNumber?: string;
  confirmationReceiptUrl?: string;
  errorMessage?: string;
}
