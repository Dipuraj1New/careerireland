import { User } from './user';
import { Document } from './document';

export enum VisaType {
  WORK = 'WORK',
  STUDY = 'STUDY',
  FAMILY = 'FAMILY',
  BUSINESS = 'BUSINESS',
  TOURIST = 'TOURIST',
  CITIZENSHIP = 'CITIZENSHIP'
}

export enum CaseStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ADDITIONAL_DOCUMENTS_REQUIRED = 'ADDITIONAL_DOCUMENTS_REQUIRED',
  PENDING_GOVERNMENT_SUBMISSION = 'PENDING_GOVERNMENT_SUBMISSION',
  SUBMITTED_TO_GOVERNMENT = 'SUBMITTED_TO_GOVERNMENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum CasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Case {
  id: string;
  applicantId: string;
  agentId?: string;
  title: string;
  description?: string;
  visaType: VisaType;
  status: CaseStatus;
  priority: CasePriority;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  completedAt?: Date;

  // Relations
  applicant?: User;
  agent?: User;
  documents?: Document[];
}

export interface CaseCreateData {
  applicantId: string;
  title: string;
  description?: string;
  visaType: VisaType;
  priority?: CasePriority;
}

export interface CaseUpdateData {
  title?: string;
  description?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  agentId?: string;
}

export interface CaseWithRelations extends Case {
  applicant: User;
  agent?: User;
  documents: Document[];
}

export interface CaseNote {
  id: string;
  caseId: string;
  userId: string;
  content: string;
  createdAt: Date;

  // Relations
  user?: User;
}

export interface CaseTimelineEvent {
  id: string;
  caseId: string;
  type: 'status_change' | 'document_upload' | 'note_added' | 'document_status_change';
  title: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  userId: string;

  // Relations
  user?: User;
}

export const VISA_TYPE_LABELS: Record<VisaType, string> = {
  [VisaType.WORK]: 'Work Visa',
  [VisaType.STUDY]: 'Study Visa',
  [VisaType.FAMILY]: 'Family Visa',
  [VisaType.BUSINESS]: 'Business Visa',
  [VisaType.TOURIST]: 'Tourist Visa',
  [VisaType.CITIZENSHIP]: 'Citizenship Application',
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  [CaseStatus.DRAFT]: 'Draft',
  [CaseStatus.SUBMITTED]: 'Submitted',
  [CaseStatus.UNDER_REVIEW]: 'Under Review',
  [CaseStatus.ADDITIONAL_DOCUMENTS_REQUIRED]: 'Additional Documents Required',
  [CaseStatus.PENDING_GOVERNMENT_SUBMISSION]: 'Pending Government Submission',
  [CaseStatus.SUBMITTED_TO_GOVERNMENT]: 'Submitted to Government',
  [CaseStatus.APPROVED]: 'Approved',
  [CaseStatus.REJECTED]: 'Rejected',
  [CaseStatus.COMPLETED]: 'Completed',
  [CaseStatus.CANCELLED]: 'Cancelled',
};

export const CASE_PRIORITY_LABELS: Record<CasePriority, string> = {
  [CasePriority.LOW]: 'Low',
  [CasePriority.MEDIUM]: 'Medium',
  [CasePriority.HIGH]: 'High',
  [CasePriority.URGENT]: 'Urgent',
};


