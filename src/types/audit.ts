export enum AuditEntityType {
  USER = 'user',
  CASE = 'case',
  DOCUMENT = 'document',
  FORM_TEMPLATE = 'form_template',
  FORM_SUBMISSION = 'form_submission',
  ACCESS_REVIEW = 'access_review',
  ACCESS_REVIEW_ITEM = 'access_review_item',
  COMPLIANCE_REQUIREMENT = 'compliance_requirement',
  COMPLIANCE_REPORT = 'compliance_report',
  COMPLIANCE_REPORT_SCHEDULE = 'compliance_report_schedule',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPDATE_STATUS = 'update_status',
  ASSIGN_AGENT = 'assign_agent',
  UPDATE_PRIORITY = 'update_priority',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE_VERSION = 'create_version',
  ACTIVATE = 'activate',
  DEPRECATE = 'deprecate',
  GENERATE = 'generate',
  SIGN = 'sign',
  VERIFY = 'verify',
  SUBMIT = 'submit',
  VIEW = 'view',
  EXPORT = 'export',
  SEARCH = 'search',
  FILTER = 'filter',
  // Access control actions
  ACCESS_CHECK = 'access_check',
  REVIEW = 'review',
  // Compliance actions
  CHECK = 'check',
  CHECK_ALL = 'check_all',
  SEND = 'send',
  SCHEDULE = 'schedule',
}

export interface AuditLog {
  id: string;
  userId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface AuditLogCreateData {
  userId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}
