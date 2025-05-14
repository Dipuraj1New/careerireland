/**
 * Types for the Security & Compliance Module
 */

// Attribute-Based Access Control Types
export enum ResourceType {
  USER = 'user',
  CASE = 'case',
  DOCUMENT = 'document',
  FORM = 'form',
  REPORT = 'report',
}

export enum ActionType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  ASSIGN = 'assign',
  SUBMIT = 'submit',
}

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
}

// Compliance Types
export enum ComplianceRequirementType {
  GDPR = 'gdpr',
  DATA_PROTECTION = 'data_protection',
  RETENTION = 'retention',
  CONSENT = 'consent',
  ACCESS_CONTROL = 'access_control',
  AUDIT = 'audit',
  BREACH_NOTIFICATION = 'breach_notification',
  CUSTOM = 'custom',
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  UNDER_REVIEW = 'under_review',
  NOT_APPLICABLE = 'not_applicable',
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  type: ComplianceRequirementType;
  status: ComplianceStatus;
  details?: Record<string, any>;
  lastChecked?: Date;
  nextCheckDue?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceCheckResult {
  requirementId: string;
  status: ComplianceStatus;
  details: Record<string, any>;
  timestamp: Date;
}

export interface ComplianceTrend {
  date: Date;
  complianceRate: number;
  compliant: number;
  nonCompliant: number;
  partiallyCompliant: number;
  underReview: number;
  total: number;
  byType?: Record<ComplianceRequirementType, number>;
}

export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html',
}

export enum ReportType {
  COMPLIANCE_SUMMARY = 'compliance_summary',
  GDPR_COMPLIANCE = 'gdpr_compliance',
  DATA_PROTECTION = 'data_protection',
  CONSENT_MANAGEMENT = 'consent_management',
  ACCESS_CONTROL = 'access_control',
  AUDIT_LOG = 'audit_log',
  CUSTOM = 'custom',
}

export interface ComplianceReport {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  parameters?: Record<string, any>;
  filePath?: string;
  fileSize?: number;
  generatedAt: Date;
  generatedBy: string;
  createdAt: Date;
}

export enum SecurityPolicyType {
  PASSWORD = 'password',
  SESSION = 'session',
  DATA_PROTECTION = 'data_protection',
  ACCESS_CONTROL = 'access_control',
  AUDIT = 'audit',
  COMPLIANCE = 'compliance',
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description?: string;
  policyType: SecurityPolicyType;
  policyData: Record<string, any>;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export enum DataRetentionEntityType {
  USER = 'user',
  CASE = 'case',
  DOCUMENT = 'document',
  AUDIT_LOG = 'audit_log',
  MESSAGE = 'message',
  FORM = 'form',
}

export interface DataRetentionPolicy {
  id: string;
  entityType: DataRetentionEntityType;
  retentionPeriod: number; // in days
  description?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum DataSubjectRequestType {
  ACCESS = 'access',
  ERASURE = 'erasure',
  RECTIFICATION = 'rectification',
  PORTABILITY = 'portability',
  RESTRICTION = 'restriction',
  OBJECTION = 'objection',
}

export enum DataSubjectRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export interface DataSubjectRequest {
  id: string;
  userId?: string;
  requestType: DataSubjectRequestType;
  status: DataSubjectRequestStatus;
  requestData: Record<string, any>;
  responseData?: Record<string, any>;
  notes?: string;
  requestedAt: Date;
  completedAt?: Date;
  createdBy?: string;
  handledBy?: string;
}

export interface FieldEncryptionKey {
  id: string;
  keyIdentifier: string;
  encryptedKey: string;
  isActive: boolean;
  createdAt: Date;
  rotationDate?: Date;
  lastUsedAt?: Date;
}

export enum SecurityAlertType {
  AUTHENTICATION_FAILURE = 'authentication_failure',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PERMISSION_VIOLATION = 'permission_violation',
  DATA_BREACH = 'data_breach',
  POLICY_VIOLATION = 'policy_violation',
  SYSTEM_VULNERABILITY = 'system_vulnerability',
}

export enum SecurityAlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum SecurityAlertStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
}

export interface SecurityAlert {
  id: string;
  alertType: SecurityAlertType;
  severity: SecurityAlertSeverity;
  source: string;
  description: string;
  details?: Record<string, any>;
  status: SecurityAlertStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPermissionGroup {
  userId: string;
  groupId: string;
  assignedAt: Date;
  assignedBy?: string;
}

export enum AccessReviewStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface AccessReview {
  id: string;
  name: string;
  description?: string;
  status: AccessReviewStatus;
  startDate: Date;
  endDate: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AccessReviewItemStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AccessReviewDecision {
  MAINTAIN = 'maintain',
  REVOKE = 'revoke',
  MODIFY = 'modify',
}

export interface AccessReviewItem {
  id: string;
  reviewId: string;
  userId: string;
  reviewerId?: string;
  status: AccessReviewItemStatus;
  decision?: AccessReviewDecision;
  notes?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export enum ConsentType {
  MARKETING = 'marketing',
  DATA_PROCESSING = 'data_processing',
  COOKIES = 'cookies',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  TERMS_OF_SERVICE = 'terms_of_service',
  PRIVACY_POLICY = 'privacy_policy',
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  consentVersion: string;
  isGranted: boolean;
  ipAddress?: string;
  userAgent?: string;
  grantedAt: Date;
  revokedAt?: Date;
}

// Request/Response types for API endpoints

export interface CreateSecurityPolicyRequest {
  name: string;
  description?: string;
  policyType: SecurityPolicyType;
  policyData: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateSecurityPolicyRequest {
  name?: string;
  description?: string;
  policyData?: Record<string, any>;
  isActive?: boolean;
}

export interface CreateDataRetentionPolicyRequest {
  entityType: DataRetentionEntityType;
  retentionPeriod: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDataRetentionPolicyRequest {
  retentionPeriod?: number;
  description?: string;
  isActive?: boolean;
}

export interface CreateDataSubjectRequestRequest {
  userId?: string;
  requestType: DataSubjectRequestType;
  requestData: Record<string, any>;
  notes?: string;
}

export interface UpdateDataSubjectRequestRequest {
  status?: DataSubjectRequestStatus;
  responseData?: Record<string, any>;
  notes?: string;
}

export interface EncryptDataRequest {
  data: string;
  context?: string;
}

export interface EncryptDataResponse {
  encryptedData: string;
  keyIdentifier: string;
}

export interface DecryptDataRequest {
  encryptedData: string;
  keyIdentifier: string;
  context?: string;
}

export interface DecryptDataResponse {
  data: string;
}

export interface CreatePermissionGroupRequest {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdatePermissionGroupRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface AssignPermissionGroupRequest {
  userId: string;
  groupId: string;
}

export interface CreateAccessReviewRequest {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  userIds: string[];
}

export interface UpdateAccessReviewItemRequest {
  status: AccessReviewItemStatus;
  decision: AccessReviewDecision;
  notes?: string;
}

export interface RecordConsentRequest {
  userId: string;
  consentType: ConsentType;
  consentVersion: string;
  isGranted: boolean;
  ipAddress?: string;
  userAgent?: string;
}
