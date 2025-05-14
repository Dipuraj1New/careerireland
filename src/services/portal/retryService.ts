/**
 * Retry Service for Portal Submissions
 * Handles automatic retries for failed portal submissions with exponential backoff
 */
import { PortalSubmission, PortalSubmissionStatus, PortalSubmissionResult } from '../../types/portal';
import * as portalRepository from '../../repositories/portalRepository';
import * as portalAutomationService from './portalAutomationService';
import * as auditLogService from '../auditLogService';
import * as notificationService from '../notificationService';

// Maximum number of retry attempts
const MAX_RETRY_ATTEMPTS = 3;

// Base delay in milliseconds (will be multiplied by 2^retryCount)
const BASE_RETRY_DELAY = 60000; // 1 minute

/**
 * Error classification for different types of portal errors
 */
export enum PortalErrorType {
  // Temporary errors that can be retried
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Permanent errors that should not be retried
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  DATA_ERROR = 'DATA_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Determine if an error is retryable based on the error message
 */
function isRetryableError(errorMessage: string): boolean {
  const retryablePatterns = [
    /network error/i,
    /timeout/i,
    /connection reset/i,
    /server error/i,
    /503/i,
    /502/i,
    /504/i,
    /session expired/i,
    /try again later/i
  ];
  
  return retryablePatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Classify error type based on error message
 */
function classifyError(errorMessage: string): PortalErrorType {
  if (/network error|connection refused|connection reset/i.test(errorMessage)) {
    return PortalErrorType.NETWORK_ERROR;
  }
  
  if (/timeout|timed out/i.test(errorMessage)) {
    return PortalErrorType.TIMEOUT_ERROR;
  }
  
  if (/server error|500|503|502|504/i.test(errorMessage)) {
    return PortalErrorType.SERVER_ERROR;
  }
  
  if (/session expired|session timeout|login again/i.test(errorMessage)) {
    return PortalErrorType.SESSION_EXPIRED;
  }
  
  if (/invalid input|validation failed|required field|invalid format/i.test(errorMessage)) {
    return PortalErrorType.VALIDATION_ERROR;
  }
  
  if (/authentication failed|invalid credentials|incorrect password/i.test(errorMessage)) {
    return PortalErrorType.AUTHENTICATION_ERROR;
  }
  
  if (/not authorized|permission denied|access denied/i.test(errorMessage)) {
    return PortalErrorType.AUTHORIZATION_ERROR;
  }
  
  if (/invalid data|data error|missing data/i.test(errorMessage)) {
    return PortalErrorType.DATA_ERROR;
  }
  
  return PortalErrorType.UNKNOWN_ERROR;
}

/**
 * Calculate delay for next retry attempt using exponential backoff
 */
function calculateRetryDelay(retryCount: number): number {
  // Exponential backoff: BASE_DELAY * 2^retryCount
  // Example: 1min, 2min, 4min
  return BASE_RETRY_DELAY * Math.pow(2, retryCount);
}

/**
 * Schedule a retry for a failed portal submission
 */
export async function scheduleRetry(
  portalSubmissionId: string,
  userId: string,
  errorMessage: string
): Promise<void> {
  try {
    // Get the portal submission
    const portalSubmission = await portalRepository.getPortalSubmissionById(portalSubmissionId);
    
    if (!portalSubmission) {
      console.error(`Cannot schedule retry: Portal submission ${portalSubmissionId} not found`);
      return;
    }
    
    // Check if we've exceeded the maximum retry attempts
    if (portalSubmission.retryCount >= MAX_RETRY_ATTEMPTS) {
      console.log(`Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached for submission ${portalSubmissionId}`);
      
      // Update submission status to FAILED
      await portalRepository.updatePortalSubmission(portalSubmissionId, {
        status: PortalSubmissionStatus.FAILED,
        errorMessage: `Maximum retry attempts reached. Last error: ${errorMessage}`
      });
      
      // Notify user about the failure
      await notificationService.sendNotification({
        userId,
        title: 'Portal Submission Failed',
        message: `Your submission to the government portal has failed after ${MAX_RETRY_ATTEMPTS} attempts. Please contact support for assistance.`,
        type: 'error',
        data: {
          portalSubmissionId,
          errorMessage
        }
      });
      
      // Log the failure
      await auditLogService.logEvent({
        userId,
        action: 'PORTAL_SUBMISSION_FAILED',
        resourceType: 'PORTAL_SUBMISSION',
        resourceId: portalSubmissionId,
        details: {
          errorMessage,
          retryCount: portalSubmission.retryCount
        }
      });
      
      return;
    }
    
    // Classify the error
    const errorType = classifyError(errorMessage);
    
    // Check if the error is retryable
    if (!isRetryableError(errorMessage)) {
      console.log(`Non-retryable error (${errorType}) for submission ${portalSubmissionId}: ${errorMessage}`);
      
      // Update submission status to FAILED
      await portalRepository.updatePortalSubmission(portalSubmissionId, {
        status: PortalSubmissionStatus.FAILED,
        errorMessage: `Non-retryable error: ${errorMessage}`
      });
      
      // Notify user about the failure
      await notificationService.sendNotification({
        userId,
        title: 'Portal Submission Failed',
        message: `Your submission to the government portal has failed due to a ${errorType.toLowerCase().replace('_', ' ')}. Please review your submission and try again.`,
        type: 'error',
        data: {
          portalSubmissionId,
          errorType,
          errorMessage
        }
      });
      
      return;
    }
    
    // Calculate delay for next retry
    const retryCount = portalSubmission.retryCount + 1;
    const retryDelay = calculateRetryDelay(retryCount);
    
    // Update submission status to RETRY_SCHEDULED
    await portalRepository.updatePortalSubmission(portalSubmissionId, {
      status: PortalSubmissionStatus.RETRY_SCHEDULED,
      retryCount,
      nextRetryAt: new Date(Date.now() + retryDelay),
      errorMessage: `Retry scheduled after error: ${errorMessage}`
    });
    
    // Log the retry scheduling
    await auditLogService.logEvent({
      userId,
      action: 'PORTAL_SUBMISSION_RETRY_SCHEDULED',
      resourceType: 'PORTAL_SUBMISSION',
      resourceId: portalSubmissionId,
      details: {
        errorMessage,
        retryCount,
        retryDelay,
        nextRetryAt: new Date(Date.now() + retryDelay)
      }
    });
    
    // Schedule the retry
    setTimeout(async () => {
      try {
        console.log(`Executing retry #${retryCount} for submission ${portalSubmissionId}`);
        
        // Update status to RETRYING
        await portalRepository.updatePortalSubmission(portalSubmissionId, {
          status: PortalSubmissionStatus.RETRYING
        });
        
        // Attempt the submission again
        const result = await portalAutomationService.submitFormToPortal(portalSubmissionId, userId);
        
        // Log the retry result
        await auditLogService.logEvent({
          userId,
          action: result.success ? 'PORTAL_SUBMISSION_RETRY_SUCCEEDED' : 'PORTAL_SUBMISSION_RETRY_FAILED',
          resourceType: 'PORTAL_SUBMISSION',
          resourceId: portalSubmissionId,
          details: {
            retryCount,
            result
          }
        });
        
      } catch (retryError) {
        console.error(`Error during retry #${retryCount} for submission ${portalSubmissionId}:`, retryError);
        
        // Log the retry error
        await auditLogService.logEvent({
          userId,
          action: 'PORTAL_SUBMISSION_RETRY_ERROR',
          resourceType: 'PORTAL_SUBMISSION',
          resourceId: portalSubmissionId,
          details: {
            retryCount,
            error: retryError.message
          }
        });
      }
    }, retryDelay);
    
    console.log(`Scheduled retry #${retryCount} for submission ${portalSubmissionId} in ${retryDelay / 1000} seconds`);
    
  } catch (error) {
    console.error('Error scheduling retry:', error);
  }
}

/**
 * Process failed submission and determine if it should be retried
 */
export async function handleFailedSubmission(
  portalSubmissionId: string,
  userId: string,
  result: PortalSubmissionResult
): Promise<void> {
  if (!result.errorMessage) {
    return;
  }
  
  // Check if the error is retryable
  if (isRetryableError(result.errorMessage)) {
    await scheduleRetry(portalSubmissionId, userId, result.errorMessage);
  } else {
    // Non-retryable error, update status to FAILED
    await portalRepository.updatePortalSubmission(portalSubmissionId, {
      status: PortalSubmissionStatus.FAILED,
      errorMessage: result.errorMessage
    });
    
    // Notify user about the failure
    await notificationService.sendNotification({
      userId,
      title: 'Portal Submission Failed',
      message: `Your submission to the government portal has failed: ${result.errorMessage}`,
      type: 'error',
      data: {
        portalSubmissionId,
        errorMessage: result.errorMessage
      }
    });
  }
}
