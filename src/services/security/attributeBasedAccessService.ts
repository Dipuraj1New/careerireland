/**
 * Attribute-Based Access Control Service
 * 
 * This service implements attribute-based access control (ABAC) to provide
 * fine-grained access control based on attributes of users, resources, and environment.
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { getPermissionsForUser } from './accessControlService';
import { User, UserRole } from '@/types/user';
import { Case, CaseStatus } from '@/types/case';
import { Document } from '@/types/document';

/**
 * Resource types that can be protected
 */
export enum ResourceType {
  USER = 'user',
  CASE = 'case',
  DOCUMENT = 'document',
  FORM = 'form',
  REPORT = 'report',
}

/**
 * Action types that can be performed on resources
 */
export enum ActionType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  ASSIGN = 'assign',
  SUBMIT = 'submit',
}

/**
 * Interface for access decision
 */
export interface AccessDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if a user has access to a resource based on attributes
 */
export async function checkAccess(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  action: ActionType
): Promise<AccessDecision> {
  // Get user permissions
  const permissions = await getPermissionsForUser(userId);
  
  // Get user details
  const userResult = await db.query(
    `SELECT * FROM users WHERE id = $1`,
    [userId]
  );
  
  if (userResult.rows.length === 0) {
    return { allowed: false, reason: 'User not found' };
  }
  
  const user = userResult.rows[0];
  
  // Check access based on resource type
  switch (resourceType) {
    case ResourceType.USER:
      return checkUserAccess(user, permissions, resourceId, action);
    case ResourceType.CASE:
      return await checkCaseAccess(user, permissions, resourceId, action);
    case ResourceType.DOCUMENT:
      return await checkDocumentAccess(user, permissions, resourceId, action);
    case ResourceType.FORM:
      return await checkFormAccess(user, permissions, resourceId, action);
    case ResourceType.REPORT:
      return await checkReportAccess(user, permissions, resourceId, action);
    default:
      return { allowed: false, reason: 'Unknown resource type' };
  }
}

/**
 * Check access to user resources
 */
function checkUserAccess(
  user: any,
  permissions: string[],
  resourceId: string,
  action: ActionType
): AccessDecision {
  // Admin can do anything
  if (user.role === UserRole.ADMIN) {
    return { allowed: true };
  }
  
  // Users can read and update their own profile
  if (user.id === resourceId && (action === ActionType.READ || action === ActionType.WRITE)) {
    return { allowed: true };
  }
  
  // Check specific permissions
  const requiredPermission = `user:${action.toLowerCase()}`;
  const requiredSelfPermission = `user:${action.toLowerCase()}:self`;
  
  if (permissions.includes(requiredPermission)) {
    return { allowed: true };
  }
  
  if (permissions.includes(requiredSelfPermission) && user.id === resourceId) {
    return { allowed: true };
  }
  
  return { 
    allowed: false, 
    reason: 'Insufficient permissions to access user resource' 
  };
}

/**
 * Check access to case resources
 */
async function checkCaseAccess(
  user: any,
  permissions: string[],
  resourceId: string,
  action: ActionType
): Promise<AccessDecision> {
  // Admin can do anything
  if (user.role === UserRole.ADMIN) {
    return { allowed: true };
  }
  
  // Get case details
  const caseResult = await db.query(
    `SELECT * FROM cases WHERE id = $1`,
    [resourceId]
  );
  
  if (caseResult.rows.length === 0) {
    return { allowed: false, reason: 'Case not found' };
  }
  
  const caseData = caseResult.rows[0];
  
  // Applicants can only access their own cases
  if (user.role === UserRole.APPLICANT) {
    if (caseData.applicant_id !== user.id) {
      return { 
        allowed: false, 
        reason: 'Applicants can only access their own cases' 
      };
    }
    
    // Check specific permissions for applicants
    const requiredSelfPermission = `case:${action.toLowerCase()}:self`;
    
    if (permissions.includes(requiredSelfPermission)) {
      // Additional attribute-based checks for applicants
      if (action === ActionType.WRITE || action === ActionType.SUBMIT) {
        // Can only modify cases in certain statuses
        const allowedStatuses = [
          CaseStatus.DRAFT, 
          CaseStatus.ADDITIONAL_INFO_REQUIRED
        ];
        
        if (!allowedStatuses.includes(caseData.status)) {
          return { 
            allowed: false, 
            reason: `Cannot modify case in ${caseData.status} status` 
          };
        }
      }
      
      return { allowed: true };
    }
  }
  
  // Agents can access cases assigned to them
  if (user.role === UserRole.AGENT) {
    // Check if agent is assigned to the case
    if (action !== ActionType.READ && caseData.agent_id !== user.id) {
      return { 
        allowed: false, 
        reason: 'Agents can only modify cases assigned to them' 
      };
    }
    
    // Check specific permissions for agents
    const requiredPermission = `case:${action.toLowerCase()}`;
    
    if (permissions.includes(requiredPermission)) {
      return { allowed: true };
    }
  }
  
  // Experts can only read cases
  if (user.role === UserRole.EXPERT) {
    if (action !== ActionType.READ) {
      return { 
        allowed: false, 
        reason: 'Experts can only read cases' 
      };
    }
    
    // Check if expert is associated with the case (through consultations)
    const consultationResult = await db.query(
      `SELECT * FROM consultations 
       WHERE expert_id = $1 AND case_id = $2`,
      [user.id, resourceId]
    );
    
    if (consultationResult.rows.length === 0) {
      return { 
        allowed: false, 
        reason: 'Experts can only access cases they are consulting on' 
      };
    }
    
    return { allowed: true };
  }
  
  return { 
    allowed: false, 
    reason: 'Insufficient permissions to access case resource' 
  };
}

/**
 * Check access to document resources
 */
async function checkDocumentAccess(
  user: any,
  permissions: string[],
  resourceId: string,
  action: ActionType
): Promise<AccessDecision> {
  // Admin can do anything
  if (user.role === UserRole.ADMIN) {
    return { allowed: true };
  }
  
  // Get document details
  const documentResult = await db.query(
    `SELECT d.*, c.applicant_id, c.agent_id 
     FROM documents d
     LEFT JOIN cases c ON d.case_id = c.id
     WHERE d.id = $1`,
    [resourceId]
  );
  
  if (documentResult.rows.length === 0) {
    return { allowed: false, reason: 'Document not found' };
  }
  
  const document = documentResult.rows[0];
  
  // Applicants can only access their own documents
  if (user.role === UserRole.APPLICANT) {
    if (document.applicant_id !== user.id) {
      return { 
        allowed: false, 
        reason: 'Applicants can only access their own documents' 
      };
    }
    
    // Check specific permissions for applicants
    const requiredSelfPermission = `document:${action.toLowerCase()}:self`;
    
    if (permissions.includes(requiredSelfPermission)) {
      return { allowed: true };
    }
  }
  
  // Agents can access documents for cases assigned to them
  if (user.role === UserRole.AGENT) {
    if (document.agent_id !== user.id) {
      return { 
        allowed: false, 
        reason: 'Agents can only access documents for cases assigned to them' 
      };
    }
    
    // Check specific permissions for agents
    const requiredPermission = `document:${action.toLowerCase()}`;
    
    if (permissions.includes(requiredPermission)) {
      return { allowed: true };
    }
  }
  
  return { 
    allowed: false, 
    reason: 'Insufficient permissions to access document resource' 
  };
}

/**
 * Check access to form resources
 */
async function checkFormAccess(
  user: any,
  permissions: string[],
  resourceId: string,
  action: ActionType
): Promise<AccessDecision> {
  // Implementation similar to document access
  // This is a simplified version
  
  // Admin can do anything
  if (user.role === UserRole.ADMIN) {
    return { allowed: true };
  }
  
  // Get form submission details
  const formResult = await db.query(
    `SELECT fs.*, c.applicant_id, c.agent_id 
     FROM form_submissions fs
     LEFT JOIN cases c ON fs.case_id = c.id
     WHERE fs.id = $1`,
    [resourceId]
  );
  
  if (formResult.rows.length === 0) {
    return { allowed: false, reason: 'Form not found' };
  }
  
  const form = formResult.rows[0];
  
  // Applicants can only access their own forms
  if (user.role === UserRole.APPLICANT) {
    if (form.applicant_id !== user.id) {
      return { 
        allowed: false, 
        reason: 'Applicants can only access their own forms' 
      };
    }
    
    // Check specific permissions for applicants
    const requiredSelfPermission = `form:${action.toLowerCase()}:self`;
    
    if (permissions.includes(requiredSelfPermission)) {
      return { allowed: true };
    }
  }
  
  // Agents can access forms for cases assigned to them
  if (user.role === UserRole.AGENT) {
    if (form.agent_id !== user.id) {
      return { 
        allowed: false, 
        reason: 'Agents can only access forms for cases assigned to them' 
      };
    }
    
    // Check specific permissions for agents
    const requiredPermission = `form:${action.toLowerCase()}`;
    
    if (permissions.includes(requiredPermission)) {
      return { allowed: true };
    }
  }
  
  return { 
    allowed: false, 
    reason: 'Insufficient permissions to access form resource' 
  };
}

/**
 * Check access to report resources
 */
async function checkReportAccess(
  user: any,
  permissions: string[],
  resourceId: string,
  action: ActionType
): Promise<AccessDecision> {
  // Admin can do anything
  if (user.role === UserRole.ADMIN) {
    return { allowed: true };
  }
  
  // Get report details
  const reportResult = await db.query(
    `SELECT * FROM analytics_reports WHERE id = $1`,
    [resourceId]
  );
  
  if (reportResult.rows.length === 0) {
    return { allowed: false, reason: 'Report not found' };
  }
  
  const report = reportResult.rows[0];
  
  // Check if user is the creator of the report
  if (report.created_by === user.id) {
    return { allowed: true };
  }
  
  // Check specific permissions
  const requiredPermission = `analytics:${action.toLowerCase()}`;
  
  if (permissions.includes(requiredPermission)) {
    return { allowed: true };
  }
  
  return { 
    allowed: false, 
    reason: 'Insufficient permissions to access report resource' 
  };
}
